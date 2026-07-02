import os
import sys
import asyncio
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_mcp_adapters.tools import load_mcp_tools

class MCPClientManager:
    def __init__(self):
        self.hotel_tools = []
        self.flight_tools = []
        self._shutdown_event = asyncio.Event()
        self._ready_event = asyncio.Event()
        self._task = None

    async def _worker(self):
        async with AsyncExitStack() as stack:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            hotel_script = os.path.join(base_dir, "mcp_servers", "hotel_server.py")
            flight_script = os.path.join(base_dir, "mcp_servers", "flight_server.py")
            
            python_exe = sys.executable

            # Hotel Server Setup
            hotel_params = StdioServerParameters(command=python_exe, args=[hotel_script])
            hotel_transport = await stack.enter_async_context(stdio_client(hotel_params))
            h_read, h_write = hotel_transport
            hotel_session = await stack.enter_async_context(ClientSession(h_read, h_write))
            await hotel_session.initialize()
            self.hotel_tools = await load_mcp_tools(hotel_session)

            # Flight Server Setup
            flight_params = StdioServerParameters(command=python_exe, args=[flight_script])
            flight_transport = await stack.enter_async_context(stdio_client(flight_params))
            f_read, f_write = flight_transport
            flight_session = await stack.enter_async_context(ClientSession(f_read, f_write))
            await flight_session.initialize()
            self.flight_tools = await load_mcp_tools(flight_session)
            
            print("Loaded Hotel MCP tools:", [t.name for t in self.hotel_tools])
            print("Loaded Flight MCP tools:", [t.name for t in self.flight_tools])
            
            self._ready_event.set()
            await self._shutdown_event.wait()

    async def initialize(self):
        self._task = asyncio.create_task(self._worker())
        await self._ready_event.wait()

    async def cleanup(self):
        self._shutdown_event.set()
        if self._task:
            await self._task

    def get_tool_by_name(self, name: str):
        for t in self.hotel_tools + self.flight_tools:
            if t.name == name:
                return t
        return None

    def get_hotel_tools(self):
        return self.hotel_tools

    def get_flight_tools(self):
        return self.flight_tools

mcp_manager = MCPClientManager()
