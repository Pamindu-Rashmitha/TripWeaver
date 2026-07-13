// TypeScript interfaces for TripWeaver frontend

export interface Hotel {
  _id: string;
  name: string;
  city: string;
  pricePerNight: number;
  roomTypes: string[];
  rating: number;
  amenities?: string[];
  imageUrl?: string;
  checkIn?: string;
  checkOut?: string;
  available?: boolean;
}

export interface Flight {
  _id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  seatsAvailable?: number;
  duration?: string;
}

export interface Activity {
  title: string;
  description: string;
  link: string;
  city: string;
  category?: string;
  rating?: number;
  price_level?: string;
  source: string;
  thumbnail?: string;
}

export interface TransportOption {
  title: string;
  description: string;
  link: string;
  city: string;
  transportType?: string;
  source: string;
  from?: string;
  to?: string;
}

export interface WeatherInfo {
  city: string;
  country?: string;
  temperature: number;
  feelsLike: number;
  tempMin?: number;
  tempMax?: number;
  humidity: number;
  condition: string;
  description: string;
  icon: string;
  windSpeed: number;
  pressure?: number;
  visibility?: number;
  clouds?: number;
  timestamp?: string;
}

export interface WeatherForecast {
  city: string;
  country?: string;
  forecasts: {
    date: string;
    tempMin: number;
    tempMax: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    precipitation?: number;
  }[];
}

export interface ThinkingStep {
  id: string;
  type: "tool_call" | "intent" | "activity";
  tool?: string;
  input?: Record<string, unknown>;
  intent?: string;
  status?: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  hotels?: Hotel[];
  flights?: Flight[];
  activities?: Activity[];
  transport?: TransportOption[];
  weather?: (WeatherInfo | WeatherForecast)[];
  thinkingSteps?: ThinkingStep[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SSEActivityEvent {
  status: string;
}

export interface SSEThinkingEvent {
  type: "tool_call" | "intent";
  tool?: string;
  input?: Record<string, unknown>;
  intent?: string;
}

export interface SSETokenEvent {
  token: string;
}

export interface SSEHotelsEvent {
  hotels: Hotel[];
}

export interface SSEFlightsEvent {
  flights: Flight[];
}

export interface SSEActivitiesEvent {
  activities: Activity[];
}

export interface SSETransportEvent {
  transport: TransportOption[];
}

export interface SSEWeatherEvent {
  weather: (WeatherInfo | WeatherForecast)[];
}

export interface SSEErrorEvent {
  message: string;
}
