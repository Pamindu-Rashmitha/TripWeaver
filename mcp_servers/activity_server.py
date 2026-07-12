import os
import sys
from typing import Any, List, Optional
from mcp.server.fastmcp import FastMCP
from tavily import TavilyClient
from dotenv import load_dotenv
from pathlib import Path
from mcp_cache import McpCache

# Load .env from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

mcp = FastMCP("TripWeaver-Activities")
cache = McpCache("activity")

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
def search_activities(city: str, category: str = None) -> List[dict]:
    """
    Search for activities and things to do in a city using web search.

    Args:
        city: The city to search activities for. Example: Bangkok, Paris, Tokyo.
        category: Optional category filter. Examples: adventure, cultural, food, nightlife, sightseeing, tours, shopping.
    """
    cache_key = cache.make_key("search_activities", city=city, category=category)
    cached = cache.get_cached(cache_key)
    if cached is not None:
        return cached

    query = f"best things to do and activities in {city}"
    if category:
        query = f"best {category} activities and things to do in {city}"

    results = _search_web(query, max_results=8)

    # Enrich results with city and category
    for r in results:
        if "error" not in r:
            r["city"] = city
            r["category"] = category or "general"

    cache.set_cached(cache_key, results, 3600)  # 1 hour
    return results


@mcp.tool()
def get_activity_details(query: str) -> List[dict]:
    """
    Search for detailed information about a specific activity, attraction, or experience.

    Args:
        query: A specific activity or attraction to search for. Example: 'Grand Palace Bangkok tickets and hours'.
    """
    cache_key = cache.make_key("get_activity_details", query=query)
    cached = cache.get_cached(cache_key)
    if cached is not None:
        return cached

    results = _search_web(query, max_results=5)
    cache.set_cached(cache_key, results, 3600)  # 1 hour
    return results


if __name__ == "__main__":
    mcp.run()
