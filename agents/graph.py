from langgraph.graph import StateGraph, START, END
from .nodes import (
    router,
    route_to_agents,
    hotel_node,
    flight_node,
    activity_node,
    transport_node,
    weather_node,
    unknown_node,
    finalizer,
)
from .entity import GraphState

def build_graph() -> StateGraph:
    builder = StateGraph(GraphState)

    builder.add_node("router", router)
    builder.add_node("hotel_node", hotel_node)
    builder.add_node("flight_node", flight_node)
    builder.add_node("activity_node", activity_node)
    builder.add_node("transport_node", transport_node)
    builder.add_node("weather_node", weather_node)
    builder.add_node("unknown_node", unknown_node)
    builder.add_node("finalizer", finalizer)

    builder.add_edge(START, "router")

    builder.add_conditional_edges(
        "router",
        route_to_agents,
        [
            "hotel_node",
            "flight_node",
            "activity_node",
            "transport_node",
            "weather_node",
            "unknown_node",
        ],
    )

    # Specialist nodes go to finalizer
    builder.add_edge("hotel_node", "finalizer")
    builder.add_edge("flight_node", "finalizer")
    builder.add_edge("activity_node", "finalizer")
    builder.add_edge("transport_node", "finalizer")
    builder.add_edge("weather_node", "finalizer")

    # unknown_node bypasses finalizer and goes to END
    builder.add_edge("unknown_node", END)

    # finalizer to END
    builder.add_edge("finalizer", END)

    return builder

graph = build_graph().compile()