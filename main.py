import json
import contextlib
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from entity import ChatRequest, ChatResponse
from agents.graph import graph
from agents.mcp_client import mcp_manager
from agents.llm import llm

conversation_history_messages = []
global_summary = ""

async def _summarize_oldest_message():
    global global_summary, conversation_history_messages
    if len(conversation_history_messages) > 3:
        user_msg, ai_msg = conversation_history_messages.pop(0)
        prompt = f"""Summarize the following new lines of conversation and combine them with the existing summary.
        Keep it concise.

        Existing summary: {global_summary if global_summary else 'None'}

        New conversation:
        User: {user_msg}
        AI: {ai_msg}
        """
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        global_summary = response.content

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing MCP Client...")
    await mcp_manager.initialize()
    yield
    print("Cleaning up MCP Client...")
    await mcp_manager.cleanup()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def custom_json_encoder(obj):
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    elif hasattr(obj, "dict"):
        return obj.dict()
    try:
        return str(obj)
    except Exception:
        return repr(obj)

def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    return f"event: {event}\ndata: {json.dumps(data, default=custom_json_encoder)}\n\n"


def _build_messages(message: str) -> list:
    """Build the message list from conversation history + new message."""
    formatted = []
    if global_summary:
        formatted.append(SystemMessage(content=f"Summary of previous conversation:\n{global_summary}"))
        
    for user_msg, assistant_msg in conversation_history_messages:
        formatted.append(HumanMessage(content=user_msg))
        formatted.append(AIMessage(content=assistant_msg))
        
    formatted.append(HumanMessage(content=message))
    return formatted


# Activity labels for each graph node
NODE_ACTIVITY = {
    "router": "Analyzing your request…",
    "hotel_node": "Searching hotels…",
    "flight_node": "Searching flights…",
    "activity_node": "Searching activities…",
    "transport_node": "Finding transport options…",
    "weather_node": "Checking weather…",
    "unknown_node": "Thinking…",
}


@app.get("/")
async def hello():
    return {"message": "Hello, World!"}


@app.get("/hotels")
async def list_hotels():
    tool = mcp_manager.get_tool_by_name("get_hotels")
    if tool:
        return await tool.ainvoke({})
    return []


@app.get("/flights")
async def list_flights():
    tool = mcp_manager.get_tool_by_name("get_flights")
    if tool:
        return await tool.ainvoke({})
    return []


@app.get("/weather/{city}")
async def get_weather(city: str):
    tool = mcp_manager.get_tool_by_name("get_current_weather")
    if tool:
        return await tool.ainvoke({"city": city})
    return {"error": "Weather tool not available"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    formatted_messages = _build_messages(request.message)

    initial_state = {
        "messages": formatted_messages,
        "intent": "",
        "response_text": "",
    }

    result = await graph.ainvoke(initial_state)
    response_text = result.get("response_text", "Something went wrong. Please try again.")
    conversation_history_messages.append((request.message, response_text))
    if len(conversation_history_messages) > 3:
        asyncio.create_task(_summarize_oldest_message())

    return ChatResponse(
        response=response_text,
        hotels=None,
        flights=None,
        activities=None,
        transport=None,
        weather=None,
    )


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    SSE streaming endpoint.
    Emits events: activity, token, hotels, flights, activities, transport, weather, error, done.
    """
    async def event_generator():
        formatted_messages = _build_messages(request.message)
        initial_state = {
            "messages": formatted_messages,
            "intent": "",
            "response_text": "",
        }

        full_response = ""

        try:
            # Stream events from the LangGraph agent
            async for event in graph.astream_events(initial_state, version="v2"):
                kind = event.get("event", "")
                name = event.get("name", "")
                data = event.get("data", {})

                # Node start → activity update
                if kind == "on_chain_start" and name in NODE_ACTIVITY:
                    yield _sse_event("activity", {"status": NODE_ACTIVITY[name]})
                    
                # Intent detection
                elif kind == "on_chain_end" and name == "router":
                    output = data.get("output", {})
                    intent = output.get("intent", "")
                    if intent:
                        yield _sse_event("thinking", {
                            "type": "intent",
                            "intent": intent,
                        })
                        
                # Tool execution start
                elif kind == "on_tool_start":
                    tool_name = name
                    tool_input = data.get("input", {})
                    yield _sse_event("thinking", {
                        "type": "tool_call",
                        "tool": tool_name,
                        "input": tool_input,
                    })

                # LLM token streaming
                elif kind == "on_chat_model_stream":
                    metadata = event.get("metadata", {})
                    if metadata.get("langgraph_node") == "router":
                        continue
                        
                    chunk = data.get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        token = chunk.content
                        full_response += token
                        yield _sse_event("token", {"token": token})

                # Tool results (hotels/flights/activities/transport/weather data)
                elif kind == "on_tool_end":
                    tool_output = data.get("output", "")
                    try:
                        parsed = None
                        if hasattr(tool_output, "artifact") and tool_output.artifact is not None:
                            if isinstance(tool_output.artifact, (list, dict)):
                                parsed = tool_output.artifact
                        
                        if parsed is None:
                            # Extract content if its a ToolMessage
                            tool_content = getattr(tool_output, "content", tool_output)

                            # Try to parse tool output as JSON for structured data
                            if isinstance(tool_content, str):
                                try:
                                    parsed = json.loads(tool_content)
                                except json.JSONDecodeError:
                                    # Fallback for Python stringified lists
                                    import ast
                                    parsed = ast.literal_eval(tool_content)
                            elif isinstance(tool_content, (list, dict)):
                                parsed = tool_content

                        if not parsed:
                            continue

                        # Detect data type by inspecting fields
                        items = parsed if isinstance(parsed, list) else [parsed]
                        if items and isinstance(items[0], dict):
                            first = items[0]

                            if any(k in first for k in ("pricePerNight", "roomTypes", "checkIn")):
                                yield _sse_event("hotels", {"hotels": items})

                            elif any(k in first for k in ("flightNumber", "airline", "departureTime")):
                                yield _sse_event("flights", {"flights": items})

                            elif any(k in first for k in ("temperature", "feelsLike")) and "condition" in first:
                                yield _sse_event("weather", {"weather": items})

                            elif "forecasts" in first:
                                yield _sse_event("weather", {"weather": items})

                            elif "link" in first and "category" in first:
                                yield _sse_event("activities", {"activities": items})

                            elif "link" in first and "transportType" in first:
                                yield _sse_event("transport", {"transport": items})

                    except Exception as e:
                        print(f"Failed to parse tool output: {e}")

            # Store in conversation history
            if full_response:
                conversation_history_messages.append((request.message, full_response))
                if len(conversation_history_messages) > 3:
                    asyncio.create_task(_summarize_oldest_message())
        except Exception as exc:
            print(f"Stream error: {traceback.format_exc()}")
            yield _sse_event("error", {
                "message": "Something went wrong while processing your request. Please try again."
            })

        yield _sse_event("done", {})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)