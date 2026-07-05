import os
import sys
from typing import Any, List, Optional
from mcp.server.fastmcp import FastMCP
from tavily import TavilyClient
from dotenv import load_dotenv
from pathlib import Path

# Load .env from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

mcp = FastMCP("TripWeaver-Transport")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")


def _search_web(query: str, max_results: int = 8) -> List[dict]:
    """Run a web search via Tavily and return parsed results."""
    if not TAVILY_API_KEY:
        return [{"error": "TAVILY_API_KEY is not configured. Please add it to your .env file."}]

    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)
        response = client.search(query=query, max_results=max_results)

        parsed = []
        for item in response.get("results", []):
            parsed.append({
                "title": item.get("title", ""),
                "description": item.get("content", ""),
                "link": item.get("url", ""),
                "source": item.get("url", "").split("/")[2] if item.get("url") else "",
            })

        return parsed if parsed else [{"error": "No results found for this search."}]

    except Exception as e:
        return [{"error": f"Search failed: {str(e)}"}]


@mcp.tool()
def search_transport(city: str, transport_type: str = None) -> List[dict]:
    """
    Search for local transport options and how to get around a city using web search.

    Args:
        city: The city to search transport for. Example: Bangkok, Singapore, Tokyo.
        transport_type: Optional transport type filter. Examples: metro, bus, taxi, tuk-tuk, ferry, train, ride-hailing.
    """
    if transport_type:
        query = f"{transport_type} transport in {city} how to use guide"
    else:
        query = f"how to get around {city} local transport guide options"

    results = _search_web(query, max_results=8)

    for r in results:
        if "error" not in r:
            r["city"] = city
            r["transportType"] = transport_type or "general"

    return results


@mcp.tool()
def get_transport_directions(city: str, from_location: str, to_location: str) -> List[dict]:
    """
    Search for directions and the best way to travel between two locations within a city.

    Args:
        city: The city where travel occurs. Example: Bangkok, Singapore.
        from_location: Starting point. Example: Suvarnabhumi Airport, Marina Bay Sands.
        to_location: Destination. Example: Khao San Road, Sentosa Island.
    """
    query = f"how to get from {from_location} to {to_location} in {city} best transport options"
    results = _search_web(query, max_results=6)

    for r in results:
        if "error" not in r:
            r["city"] = city
            r["from"] = from_location
            r["to"] = to_location

    return results


if __name__ == "__main__":
    mcp.run()
