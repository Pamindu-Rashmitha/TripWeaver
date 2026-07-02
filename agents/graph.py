from langgraph.graph import StateGraph, START, END
from .nodes import router, hotel_node, flight_node, unknown_node, route_after_extraction
from .entity import GraphState

def build_graph() -> StateGraph:
    builder = StateGraph(GraphState)

    builder.add_node("router", router)
    builder.add_node("hotel_node", hotel_node)
    builder.add_node("flight_node", flight_node)
    builder.add_node("unknown_node", unknown_node)

    builder.add_edge(START, "router")

    builder.add_conditional_edges(
        "router",
        route_after_extraction,
        {
            "hotel": "hotel_node",
            "flight": "flight_node",
            "unknown": "unknown_node",
        },
    )

    builder.add_edge("hotel_node", END)
    builder.add_edge("flight_node", END)
    builder.add_edge("unknown_node", END)

    return builder

graph = build_graph().compile()