from typing import TypedDict, Annotated, List
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage

class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    intent: str
    response_text: str