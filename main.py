import json
import contextlib
import traceback
import warnings
from typing import Optional
from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import os
from openai import AsyncOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from entity import ChatRequest, ChatResponse
from agents.graph import graph
from agents.mcp_client import mcp_manager
from agents.llm import llm
from auth import get_required_user, UserInfo

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

from cache import redis_cache
from database import db

def _get_user_key(user: UserInfo) -> str:
    """Return a stable key for per-user history."""
    return user.user_id


async def _summarize_oldest_message(user_key: str):
    history = await redis_cache.get_conversation_history(user_key)
    if len(history) > 3:
        user_msg, ai_msg = history.pop(0)
        await redis_cache.set_conversation_history(user_key, history)
        existing = await redis_cache.get_conversation_summary(user_key)
        prompt = f"""Summarize the following new lines of conversation and combine them with the existing summary.
        Keep it concise.

        Existing summary: {existing if existing else 'None'}

        New conversation:
        User: {user_msg}
        AI: {ai_msg}
        """
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        await redis_cache.set_conversation_summary(user_key, response.content)

async def _generate_title(prompt: str) -> str:
    try:
        sys_msg = SystemMessage(content="Generate a short, 3-5 word title for the following prompt. Respond with only the title, no quotes or punctuation.")
        usr_msg = HumanMessage(content=prompt)
        res = await llm.ainvoke([sys_msg, usr_msg])
        return res.content.strip().strip('"').strip("'")
    except Exception:
        return "New Chat"

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting Redis...")
    await redis_cache.connect()

    print("Initializing MCP Client...")
    await mcp_manager.initialize()

    yield

    print("Cleaning up MCP Client...")
    await mcp_manager.cleanup()

    await redis_cache.disconnect()
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


async def _build_messages(message: str, user_key: str) -> list:
    """Build the message list from per-user conversation history + new message."""
    formatted = []
    summary = await redis_cache.get_conversation_summary(user_key)
    if summary:
        formatted.append(SystemMessage(content=f"Summary of previous conversation:\n{summary}"))

    history = await redis_cache.get_conversation_history(user_key)
    for user_msg, assistant_msg in history:
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
    "finalizer": "Finalizing answer…",
}


@app.get("/")
async def hello():
    return {"message": "Hello, World!"}


@app.get("/api/conversations")
async def list_conversations(user: UserInfo = Depends(get_required_user)):
    if not db.is_enabled():
        return []
    
    # Run synchronously in thread to avoid blocking event loop
    conversations = await asyncio.to_thread(db.get_conversations, user.user_id)
    return conversations

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, user: UserInfo = Depends(get_required_user)):
    if not db.is_enabled():
        return []
    
    messages = await asyncio.to_thread(db.get_messages, conversation_id)
    return messages


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: UserInfo = Depends(get_required_user)):
    if not db.is_enabled():
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database connection is disabled")
    
    success = await asyncio.to_thread(db.delete_conversation, conversation_id, user.user_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found or not owned by user")
    
    # Invalidate rolling context cache for the user in Redis so they start fresh
    user_key = _get_user_key(user)
    await redis_cache.set_conversation_history(user_key, [])
    await redis_cache.set_conversation_summary(user_key, "")
    
    return {"success": True}



@app.get("/hotels")
async def list_hotels():
    cache_key = "tw:api:hotels:list"
    cached = await redis_cache.get_cached_response(cache_key)
    if cached is not None:
        return cached
    tool = mcp_manager.get_tool_by_name("get_hotels")
    if tool:
        res = await tool.ainvoke({})
        await redis_cache.set_cached_response(cache_key, res, 600)
        return res
    return []


@app.get("/flights")
async def list_flights():
    cache_key = "tw:api:flights:list"
    cached = await redis_cache.get_cached_response(cache_key)
    if cached is not None:
        return cached
    tool = mcp_manager.get_tool_by_name("get_flights")
    if tool:
        res = await tool.ainvoke({})
        await redis_cache.set_cached_response(cache_key, res, 600)
        return res
    return []


@app.get("/weather/{city}")
async def get_weather(city: str):
    cache_key = f"tw:api:weather:{city}"
    cached = await redis_cache.get_cached_response(cache_key)
    if cached is not None:
        return cached
    tool = mcp_manager.get_tool_by_name("get_current_weather")
    if tool:
        res = await tool.ainvoke({"city": city})
        await redis_cache.set_cached_response(cache_key, res, 600)
        return res
    return {"error": "Weather tool not available"}


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...), user: UserInfo = Depends(get_required_user)):
    try:
        import tempfile
        ext = os.path.splitext(file.filename)[1] if file.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        with open(temp_file_path, "rb") as audio_file:
            transcript = await openai_client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
            
        os.remove(temp_file_path)
        return {"text": transcript.text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user: UserInfo = Depends(get_required_user)):
    user_key = _get_user_key(user)
    formatted_messages = await _build_messages(request.message, user_key)

    # Prefer JWT-verified email/name
    initial_state = {
        "messages": formatted_messages,
        "intent": "",
        "intents": [],
        "agent_responses": [],
        "response_text": "",
        "finalized": False,
        "user_id": user.user_id,
        "user_email": user.email or request.user_email or "",
        "user_name": user.name or request.user_name or "",
        "authenticated": True,
    }

    result = await graph.ainvoke(initial_state)
    response_text = result.get("response_text", "Something went wrong. Please try again.")
    history = await redis_cache.get_conversation_history(user_key)
    history.append((request.message, response_text))
    await redis_cache.set_conversation_history(user_key, history)
    if len(history) > 3:
        asyncio.create_task(_summarize_oldest_message(user_key))

    return ChatResponse(
        response=response_text,
        hotels=None,
        flights=None,
        activities=None,
        transport=None,
        weather=None,
    )


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, user: UserInfo = Depends(get_required_user)):
    """
    SSE streaming endpoint.
    Emits events: activity, token, hotels, flights, activities, transport, weather, error, done.
    """
    user_key = _get_user_key(user)

    async def event_generator():
        resolved_email = user.email or request.user_email or ""
        resolved_name = user.name or request.user_name or ""
        print(f"DEBUG USER in chat_stream: JWT Info={user}, Resolved Name='{resolved_name}', Resolved Email='{resolved_email}'")
        
        conversation_id = request.conversation_id
        if db.is_enabled() and not conversation_id:
            title = await _generate_title(request.message)
            conversation_id = await asyncio.to_thread(db.create_conversation, user.user_id, title)
            if conversation_id:
                yield _sse_event("conversation_info", {"conversation_id": conversation_id, "title": title})
        
        formatted_messages = await _build_messages(request.message, user_key)
        initial_state = {
            "messages": formatted_messages,
            "intent": "",
            "intents": [],
            "agent_responses": [],
            "response_text": "",
            "finalized": False,
            "user_id": user.user_id,
            "user_email": resolved_email,
            "user_name": resolved_name,
            "authenticated": True,
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
                    yield _sse_event("thinking", {
                        "type": "tool_call",
                        "tool": tool_name,
                    })

                # LLM token streaming
                elif kind == "on_chat_model_stream":
                    metadata = event.get("metadata", {})
                    current_node = metadata.get("langgraph_node", "")
                    # Only stream tokens from finalizer node or unknown_node
                    if current_node not in ("finalizer", "unknown_node"):
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

            # Store in per-user conversation history
            if full_response:
                if db.is_enabled() and conversation_id:
                    await asyncio.to_thread(db.add_message, conversation_id, "user", request.message)
                    await asyncio.to_thread(db.add_message, conversation_id, "ai", full_response)

                history = await redis_cache.get_conversation_history(user_key)
                history.append((request.message, full_response))
                await redis_cache.set_conversation_history(user_key, history)
                if len(history) > 3:
                    asyncio.create_task(_summarize_oldest_message(user_key))
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
