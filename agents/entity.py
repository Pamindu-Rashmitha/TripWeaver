from typing import TypedDict, Annotated, List
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage
from operator import add

class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    intent: str
    intents: List[str]
    agent_responses: Annotated[List[str], add]
    response_text: str
    finalized: bool
    user_id: str
    user_email: str
    user_name: str
    authenticated: bool
