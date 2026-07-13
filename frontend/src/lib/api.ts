// Configurable API base URL for TripWeaver backend
// Uses environment variable NEXT_PUBLIC_API_URL, defaults to localhost:8000

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ENDPOINTS = {
  chat: `${API_BASE_URL}/chat`,
  chatStream: `${API_BASE_URL}/chat/stream`,
  hotels: `${API_BASE_URL}/hotels`,
  flights: `${API_BASE_URL}/flights`,
  conversations: `${API_BASE_URL}/api/conversations`,
} as const;
