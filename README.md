# TripWeaver

## Project Overview

TripWeaver is an intelligent, AI-powered travel planning assistant designed to streamline your trip organization. By leveraging advanced language models and specialized data agents, TripWeaver provides seamless travel planning, including flight searches, hotel recommendations, activity planning, and real-time weather updates.

### Tech Stack
- **Backend:** FastAPI, Python, LangGraph, LangChain, Redis, Supabase
- **Frontend:** Next.js (React), Tailwind CSS, shadcn/ui
- **Authentication:** Clerk
- **AI/Agents:** Groq, OpenAI, Model Context Protocol (MCP)

---

## Environment Variables

To run this project locally, you will need to set up environment variables. 

### Backend (`.env`)
Create a `.env` file in the root directory based on the provided `.env.example`:

```env
# API Configs
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Database & Cache
REDIS_URL=your_redis_connection_url
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
BACKEND_URL=http://localhost:8000/chat
```

---

## Installation Steps

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (optional, for containerized deployment)

### 1. Backend Setup
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd TripWeaver
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
The frontend will be accessible at `http://localhost:3000`.

---

## MCP Server Setup Guide

TripWeaver uses the Model Context Protocol (MCP) to manage specialized tool servers. These servers are located in the `mcp_servers` directory and are responsible for fetching real-time data for the AI agent.

### Available MCP Servers
- `activity_server.py`: Fetches local activities and attractions.
- `flight_server.py`: Handles flight search and availability.
- `hotel_server.py`: Manages hotel searching and booking options.
- `transport_server.py`: Retrieves local transportation options.
- `weather_server.py`: Fetches real-time weather data for destinations.

### Initialization
The MCP servers are automatically initialized by the backend during the FastAPI application startup via the `mcp_manager` in `agents/mcp_client.py`.

### Extending MCP Servers
To add a new tool:
1. Create a new `[name]_server.py` in the `mcp_servers` directory.
2. Implement your tool logic.
3. Ensure the new server is registered within the `mcp_manager` configuration.

---

## Deployment Steps

TripWeaver includes a `docker-compose.yml` for easy full-stack deployment.

1. Ensure Docker and Docker Compose are installed on your machine.
2. Make sure your `.env` (root) and `frontend/.env.local` files are properly configured.
3. Run the following command from the root of the project:

```bash
docker-compose up -d --build
```

This will spin up both the backend (exposed on port `8000`) and the frontend (exposed on port `8080`).

---

## User Guide

Welcome to TripWeaver! Here is a quick guide to get you started:

1. **Authentication:** 
   Upon visiting the app, you will be prompted to log in or create an account securely via Clerk.

2. **Starting a Chat:**
   Once logged in, you'll see the main chat interface. Simply type your travel prompt.
   *Example: "Plan a 3-day trip to Paris for next weekend. I want to visit museums and need hotel recommendations."*

3. **Interactive Planning:**
   - The AI agent will dynamically invoke the appropriate MCP servers (weather, flights, hotels, activities) based on your request.
   - You can see the agent's thought process in the "Thinking Panel" (if enabled) as it orchestrates the different tasks.
   - The response will include structured travel plans, up-to-date weather forecasts, and relevant booking options.

4. **History:**
   Your previous travel planning sessions are saved automatically, allowing you to pick up where you left off.
