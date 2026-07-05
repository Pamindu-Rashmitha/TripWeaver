from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from pydantic import BaseModel, Field
from typing import Literal

from .llm import llm
from .entity import GraphState
from .mcp_client import mcp_manager

class TravelIntent(BaseModel):
    intent: Literal["hotel", "flight", "activity", "transport", "weather", "unknown"] = Field(
        default="unknown",
        description="Main user intent: hotel, flight, activity, transport, weather, or unknown."
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


async def activity_node(state: GraphState) -> dict:
    tools = mcp_manager.get_activity_tools()

    system_message = SystemMessage(
        content="You are a helpful travel activities assistant. Use the provided tools to search for activities, "
                "things to do, tours, attractions, and experiences in the user's destination city. "
                "Present the results in a clear, engaging format with descriptions and links. "
                "If the user asks about a specific activity, use get_activity_details to find more information. "
                "If you need more details (e.g. which city), ask the user."
    )

    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})

    return {"response_text": response["messages"][-1].content}


async def transport_node(state: GraphState) -> dict:
    tools = mcp_manager.get_transport_tools()

    system_message = SystemMessage(
        content="You are a helpful local transport assistant. Use the provided tools to search for local "
                "transportation options, public transit info, and directions in the user's destination city. "
                "Present the results clearly with practical tips for travelers. "
                "If the user asks how to get between two specific locations, use get_transport_directions. "
                "If you need more details (e.g. which city), ask the user."
    )

    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})

    return {"response_text": response["messages"][-1].content}


async def weather_node(state: GraphState) -> dict:
    tools = mcp_manager.get_weather_tools()

    system_message = SystemMessage(
        content="You are a helpful weather assistant for travelers. Use the provided tools to get current weather "
                "conditions and forecasts for the user's destination city. "
                "Present weather data clearly with temperature, conditions, humidity, and wind. "
                "Include practical travel advice based on the weather (e.g. 'bring an umbrella', 'wear sunscreen'). "
                "If the user asks for a forecast, use get_weather_forecast. For current conditions, use get_current_weather. "
                "If you need more details (e.g. which city), ask the user."
    )

    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})

    return {"response_text": response["messages"][-1].content}


async def unknown_node(state: GraphState) -> dict:
    system_message = SystemMessage(
        content="You are a general travel assistant. You can help with general questions. "
                "For hotels and flights, guide the user to ask you to search or book them. "
                "You can also help with activities, local transport, and weather information."
    )
    
    response = await llm.ainvoke([system_message] + state["messages"])
    return {"response_text": response.content}


def route_after_extraction(state: GraphState) -> str:
    intent = state.get("intent", "unknown")
    if intent == "hotel":
        return "hotel"
    if intent == "flight":
        return "flight"
    if intent == "activity":
        return "activity"
    if intent == "transport":
        return "transport"
    if intent == "weather":
        return "weather"
    return "unknown"