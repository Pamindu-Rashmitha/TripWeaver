import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    recent_pairs = conversation_history_messages[-3:]
    
    formatted_messages = []
    for user_msg, assistant_msg in recent_pairs:
        formatted_messages.append(HumanMessage(content=user_msg))
        formatted_messages.append(AIMessage(content=assistant_msg))
    
    formatted_messages.append(HumanMessage(content=request.message))

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)