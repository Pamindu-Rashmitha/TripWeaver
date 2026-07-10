from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from pydantic import BaseModel, Field
from typing import Literal, List
from langgraph.types import Send

from .llm import llm
from .entity import GraphState
from .mcp_client import mcp_manager
from .prompts import SYSTEM_PROMPT, SYSTEM_PROMPT_FOR_UNKNOWN_NODE, FINALIZER_PROMPT

class TravelIntents(BaseModel):
    intents: List[Literal["hotel", "flight", "activity", "transport", "weather", "unknown"]] = Field(
        default=["unknown"],
        description="All detected travel intents from the user message."
    )

travel_extractor = llm.with_structured_output(TravelIntents)

INTENT_TO_NODE = {
    "hotel": "hotel_node",
    "flight": "flight_node",
    "activity": "activity_node",
    "transport": "transport_node",
    "weather": "weather_node",
}

async def router(state: GraphState) -> dict:
    try:
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        extracted = await travel_extractor.ainvoke(messages)
        intents = extracted.intents or ["unknown"]
    except Exception:
        intents = ["unknown"]

    # Normalise: unknown cannot coexist with other intents
    if "unknown" in intents and len(intents) > 1:
        intents = [i for i in intents if i != "unknown"]

    return {
        "intents": intents,
        "intent": intents[0] if intents else "unknown",
        "agent_responses": []
    }


def route_to_agents(state: GraphState):
    intents = state.get("intents", ["unknown"])

    if intents == ["unknown"]:
        return "unknown_node"

    # Spreadout to all relevant agent nodes in parallel via Send
    return [
        Send(INTENT_TO_NODE[intent], state)
        for intent in intents
        if intent in INTENT_TO_NODE
    ]


async def hotel_node(state: GraphState) -> dict:
    tools = mcp_manager.get_hotel_tools()
    
    system_message = SystemMessage(
        content="You are a helpful hotel booking assistant. Use the provided tools to search and book hotels. "
                "If a tool call fails or the server is unavailable, inform the user gracefully instead of crashing. "
                "If you need more details from the user (e.g. check-in date, guest name), ask them for it."
    )
    
    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})
    
    return {"agent_responses": [response["messages"][-1].content]}


async def flight_node(state: GraphState) -> dict:
    tools = mcp_manager.get_flight_tools()
    
    system_message = SystemMessage(
        content="You are a helpful flight booking assistant. Use the provided tools to search and book flights. "
                "If a tool call fails or the server is unavailable, inform the user gracefully instead of crashing. "
                "If you need more details from the user (e.g. flight date, passenger name), ask them for it."
    )
    
    agent = create_react_agent(llm, tools=tools, prompt=system_message)
    response = await agent.ainvoke({"messages": state["messages"]})
    
    return {"agent_responses": [response["messages"][-1].content]}


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

    return {"agent_responses": [response["messages"][-1].content]}


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

    return {"agent_responses": [response["messages"][-1].content]}


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

    return {"agent_responses": [response["messages"][-1].content]}


async def unknown_node(state: GraphState) -> dict:
    system_message = SystemMessage(content=SYSTEM_PROMPT_FOR_UNKNOWN_NODE)
    
    response = await llm.ainvoke([system_message] + state["messages"])
    return {"response_text": response.content, "finalized": True}


async def finalizer(state: GraphState) -> dict:
    drafts = state.get("agent_responses", [])

    if not drafts:
        return {"response_text": "I'm sorry, something went wrong. Please try again.", "finalized": True}

    combined = "\n\n---\n\n".join(
        f"[Draft {i+1}]\n{d}" for i, d in enumerate(drafts)
    )
    messages = [
        SystemMessage(content=FINALIZER_PROMPT),
        HumanMessage(content=f"Draft answers:\n\n{combined}"),
    ]
    response = await llm.ainvoke(messages)
    return {"response_text": response.content, "finalized": True}