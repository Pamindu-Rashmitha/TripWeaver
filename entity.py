from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    hotels: Optional[List[dict]] = None
    flights: Optional[List[dict]] = None
    activities: Optional[List[dict]] = None
    transport: Optional[List[dict]] = None
    weather: Optional[List[dict]] = None