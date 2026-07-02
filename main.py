import json
import contextlib
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage

from entity import ChatRequest, ChatResponse
from agents.graph import graph
from agents.mcp_client import mcp_manager

conversation_history_messages = []

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


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _build_messages(message: str) -> list:
    """Build the message list from conversation history + new message."""
    recent_pairs = conversation_history_messages[-3:]
    formatted = []
    for user_msg, assistant_msg in recent_pairs:
        formatted.append(HumanMessage(content=user_msg))
        formatted.append(AIMessage(content=assistant_msg))
    formatted.append(HumanMessage(content=message))
    return formatted


# Activity labels for each graph node
NODE_ACTIVITY = {
    "router": "Analyzing your request…",
    "hotel_node": "Searching hotels…",
    "flight_node": "Searching flights…",
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

    return ChatResponse(
        response=response_text,
        hotels=None,
        flights=None,
    )


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    SSE streaming endpoint.
    Emits events: activity, token, hotels, flights, error, done.
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

                # Tool results (hotels/flights data)
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

                        # Detect hotels or flights data
                        items = parsed if isinstance(parsed, list) else [parsed]
                        if items and isinstance(items[0], dict):
                            if any(k in items[0] for k in ("pricePerNight", "roomTypes", "checkIn")):
                                yield _sse_event("hotels", {"hotels": items})
                            elif any(k in items[0] for k in ("flightNumber", "airline", "departureTime")):
                                yield _sse_event("flights", {"flights": items})
                    except Exception as e:
                        print(f"Failed to parse tool output: {e}")

            # Store in conversation history
            if full_response:
                conversation_history_messages.append((request.message, full_response))

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