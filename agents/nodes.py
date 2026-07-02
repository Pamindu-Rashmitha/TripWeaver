from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from pydantic import BaseModel, Field
from typing import Literal

from .llm import llm
from .entity import GraphState
from .mcp_client import mcp_manager

class TravelIntent(BaseModel):
    intent: Literal["hotel", "flight", "unknown"] = Field(
        default="unknown",
        description="Main user intent: hotel, flight, or unknown."
    )

travel_extractor = llm.with_structured_output(TravelIntent)

async def router(state: GraphState) -> dict:
    try:
        extracted = await travel_extractor.ainvoke(state["messages"])
        intent = extracted.intent
    except Exception:
        intent = "unknown"

    return {"intent": intent}


async def hotel_node(state: GraphState) -> dict:
    tools = mcp_manager.get_hotel_tools()
    
    system_message = SystemMessage(
        content="You are a helpful hotel booking assistant. Use the provided tools to search and book hotels. "
                "If a tool call fails or the server is unavailable, inform the user gracefully instead of crashing. "
                "If you need more details from the user (e.g. check-in date, guest name), ask them for it."
    )
    
    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})
    
    return {"response_text": response["messages"][-1].content}


async def flight_node(state: GraphState) -> dict:
    tools = mcp_manager.get_flight_tools()
    
    system_message = SystemMessage(
        content="You are a helpful flight booking assistant. Use the provided tools to search and book flights. "
                "If a tool call fails or the server is unavailable, inform the user gracefully instead of crashing. "
                "If you need more details from the user (e.g. flight date, passenger name), ask them for it."
    )
    
    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})
    
    return {"response_text": response["messages"][-1].content}


async def unknown_node(state: GraphState) -> dict:
    system_message = SystemMessage(
        content="You are a general travel assistant. You can help with general questions. "
                "For hotels and flights, guide the user to ask you to search or book them."
    )
    
    response = await llm.ainvoke([system_message] + state["messages"])
    return {"response_text": response.content}


def route_after_extraction(state: GraphState) -> str:
    intent = state.get("intent", "unknown")
    if intent == "hotel":
        return "hotel"
    if intent == "flight":
        return "flight"
    return "unknown"