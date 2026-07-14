import os
import sys
from typing import Any, List, Optional
import requests
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
from mcp_cache import McpCache

# Load .env from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

mcp = FastMCP("TripWeaver-Weather")
cache = McpCache("weather")

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"


def _fetch_weather(endpoint: str, params: dict) -> Any:
    """Make a request to the OpenWeatherMap API."""
    if not OPENWEATHER_API_KEY:
        return {"error": "OPENWEATHER_API_KEY is not configured. Please add it to your .env file."}

    params["appid"] = OPENWEATHER_API_KEY
    params["units"] = "metric"  # Celsius

    try:
        response = requests.get(f"{OPENWEATHER_BASE}/{endpoint}", params=params, timeout=10)
        data = response.json()

        if response.status_code != 200:
            return {"error": data.get("message", f"API returned status {response.status_code}")}

        return data
    except Exception as e:
        return {"error": f"Weather API request failed: {str(e)}"}


@mcp.tool()
def get_current_weather(city: str) -> dict:
    """
    Get the current weather conditions for a city using OpenWeatherMap API.

    Args:
        city: The city name to get weather for. Example: Bangkok, Tokyo, Paris, London.
    """
    cache_key = f"tw:mcp:weather:current:{city.strip().lower()}"
    cached = cache.get_cached(cache_key)
    if cached is not None:
        return cached

    data = _fetch_weather("weather", {"q": city})

    if "error" in data:
        return data

    try:
        weather_info = data.get("weather", [{}])[0]
        main = data.get("main", {})
        wind = data.get("wind", {})

        result = {
            "city": data.get("name", city),
            "country": data.get("sys", {}).get("country", ""),
            "temperature": round(main.get("temp", 0), 1),
            "feelsLike": round(main.get("feels_like", 0), 1),
            "tempMin": round(main.get("temp_min", 0), 1),
            "tempMax": round(main.get("temp_max", 0), 1),
            "humidity": main.get("humidity", 0),
            "pressure": main.get("pressure", 0),
            "condition": weather_info.get("main", "Unknown"),
            "description": weather_info.get("description", ""),
            "icon": weather_info.get("icon", ""),
            "windSpeed": round(wind.get("speed", 0), 1),
            "visibility": data.get("visibility", 0),
            "clouds": data.get("clouds", {}).get("all", 0),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        cache.set_cached(cache_key, result, 600)  # 10 minutes
        return result
    except Exception as e:
        return {"error": f"Failed to parse weather data: {str(e)}"}


@mcp.tool()
def get_weather_forecast(city: str, days: int = 5) -> dict:
    """
    Get a multi-day weather forecast for a city using OpenWeatherMap API.

    Args:
        city: The city name to get forecast for. Example: Bangkok, Tokyo, Paris.
        days: Number of days to forecast (1-5). Default is 5.
    """
    days = max(1, min(days, 5))
    cache_key = f"tw:mcp:weather:forecast:{city.strip().lower()}:{days}"
    cached = cache.get_cached(cache_key)
    if cached is not None:
        return cached

    data = _fetch_weather("forecast", {"q": city, "cnt": days * 8})  

    if "error" in data:
        return data

    try:
        forecasts_by_day = {}

        for entry in data.get("list", []):
            dt_txt = entry.get("dt_txt", "")
            date_str = dt_txt.split(" ")[0] if dt_txt else "unknown"

            if date_str not in forecasts_by_day:
                forecasts_by_day[date_str] = {
                    "date": date_str,
                    "temps": [],
                    "conditions": [],
                    "descriptions": [],
                    "humidity": [],
                    "wind_speeds": [],
                    "precipitation": 0,
                }

            main = entry.get("main", {})
            weather = entry.get("weather", [{}])[0]
            wind = entry.get("wind", {})

            day = forecasts_by_day[date_str]
            day["temps"].append(main.get("temp", 0))
            day["conditions"].append(weather.get("main", ""))
            day["descriptions"].append(weather.get("description", ""))
            day["humidity"].append(main.get("humidity", 0))
            day["wind_speeds"].append(wind.get("speed", 0))

            # Accumulate rain/snow
            rain = entry.get("rain", {}).get("3h", 0)
            snow = entry.get("snow", {}).get("3h", 0)
            day["precipitation"] += rain + snow

        # Aggregate daily summaries
        daily_forecasts = []
        for date_str in sorted(forecasts_by_day.keys())[:days]:
            day = forecasts_by_day[date_str]
            # Pick the most common condition
            condition_counts = {}
            for c in day["conditions"]:
                condition_counts[c] = condition_counts.get(c, 0) + 1
            main_condition = max(condition_counts, key=condition_counts.get) if condition_counts else "Unknown"

            desc_counts = {}
            for d in day["descriptions"]:
                desc_counts[d] = desc_counts.get(d, 0) + 1
            main_description = max(desc_counts, key=desc_counts.get) if desc_counts else ""

            daily_forecasts.append({
                "date": date_str,
                "tempMin": round(min(day["temps"]), 1) if day["temps"] else 0,
                "tempMax": round(max(day["temps"]), 1) if day["temps"] else 0,
                "condition": main_condition,
                "description": main_description,
                "humidity": round(sum(day["humidity"]) / len(day["humidity"]), 0) if day["humidity"] else 0,
                "windSpeed": round(max(day["wind_speeds"]), 1) if day["wind_speeds"] else 0,
                "precipitation": round(day["precipitation"], 1),
            })

        city_name = data.get("city", {}).get("name", city)
        country = data.get("city", {}).get("country", "")

        result = {
            "city": city_name,
            "country": country,
            "forecasts": daily_forecasts,
        }
        cache.set_cached(cache_key, result, 1800)  # 30 minutes
        return result
    except Exception as e:
        return {"error": f"Failed to parse forecast data: {str(e)}"}


if __name__ == "__main__":
    cache.connect()
    mcp.run()
