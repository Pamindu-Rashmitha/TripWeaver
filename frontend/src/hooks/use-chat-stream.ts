"use client";

import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  Hotel,
  Flight,
  Activity,
  TransportOption,
  WeatherInfo,
  WeatherForecast,
  ThinkingStep,
} from "@/lib/types";
import { ENDPOINTS } from "@/lib/api";

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatStream(initialConversationId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userMessage: string, authToken?: string, user?: { name: string; email: string }) => {
    if (!userMessage.trim()) return;

    // Clear previous error
    setError(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    const assistantId = generateId();
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setActivity("Analyzing your request…");

    // Abort previous request if any
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantAdded = false;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(ENDPOINTS.chatStream, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage,
          user_name: user?.name,
          user_email: user?.email,
          conversation_id: conversationId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let accumulatedHotels: Hotel[] = [];
      let accumulatedFlights: Flight[] = [];
      let accumulatedActivities: Activity[] = [];
      let accumulatedTransport: TransportOption[] = [];
      let accumulatedWeather: (WeatherInfo | WeatherForecast)[] = [];
      let accumulatedThinkingSteps: ThinkingStep[] = [];

      const ensureAssistantMessage = () => {
        if (!assistantAdded) {
          assistantAdded = true;
          setActivity(null);
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant" as const,
              content: accumulatedContent,
              hotels: accumulatedHotels.length ? accumulatedHotels : undefined,
              flights: accumulatedFlights.length ? accumulatedFlights : undefined,
              activities: accumulatedActivities.length ? accumulatedActivities : undefined,
              transport: accumulatedTransport.length ? accumulatedTransport : undefined,
              weather: accumulatedWeather.length ? accumulatedWeather : undefined,
              thinkingSteps: accumulatedThinkingSteps.length ? accumulatedThinkingSteps : undefined,
              timestamp: new Date(),
              isStreaming: true,
            },
          ]);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            try {
              const data = JSON.parse(dataStr);

              switch (eventType) {
                case "conversation_info":
                  setConversationId(data.conversation_id);
                  // Optional: if parent needs to know, we could emit an event here
                  break;

                case "activity":
                  setActivity(data.status);
                  accumulatedThinkingSteps = [
                    ...accumulatedThinkingSteps,
                    {
                      id: generateId(),
                      type: "activity",
                      status: data.status,
                      timestamp: new Date(),
                    },
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, thinkingSteps: accumulatedThinkingSteps }
                        : msg
                    )
                  );
                  break;

                case "thinking":
                  accumulatedThinkingSteps = [
                    ...accumulatedThinkingSteps,
                    {
                      id: generateId(),
                      type: data.type,
                      tool: data.tool,
                      input: data.input,
                      intent: data.intent,
                      timestamp: new Date(),
                    },
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, thinkingSteps: accumulatedThinkingSteps }
                        : msg
                    )
                  );
                  break;

                case "token":
                  accumulatedContent += data.token;
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                  break;

                case "hotels":
                  accumulatedHotels = [
                    ...accumulatedHotels,
                    ...(data.hotels || []),
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, hotels: accumulatedHotels }
                        : msg
                    )
                  );
                  break;

                case "flights":
                  accumulatedFlights = [
                    ...accumulatedFlights,
                    ...(data.flights || []),
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, flights: accumulatedFlights }
                        : msg
                    )
                  );
                  break;

                case "activities":
                  accumulatedActivities = [
                    ...accumulatedActivities,
                    ...(data.activities || []),
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, activities: accumulatedActivities }
                        : msg
                    )
                  );
                  break;

                case "transport":
                  accumulatedTransport = [
                    ...accumulatedTransport,
                    ...(data.transport || []),
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, transport: accumulatedTransport }
                        : msg
                    )
                  );
                  break;

                case "weather":
                  accumulatedWeather = [
                    ...accumulatedWeather,
                    ...(data.weather || []),
                  ];
                  ensureAssistantMessage();
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, weather: accumulatedWeather }
                        : msg
                    )
                  );
                  break;

                case "error":
                  setError(
                    data.message ||
                    "Something went wrong. Please try again."
                  );
                  break;

                case "done":
                  // Finalize the message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  );
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (assistantAdded) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(errorMessage);

      if (assistantAdded) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId && !last.content) {
            return prev.slice(0, -1);
          }
          return prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg
          );
        });
      }
    } finally {
      setIsLoading(false);
      setActivity(null);
      abortRef.current = null;
    }
  }, [conversationId]);

  const retry = useCallback((authToken?: string, user?: { name: string; email: string }) => {
    // Find the last user message and resend it
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the last assistant message 
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (prev[lastIdx]?.role === "assistant") {
          return prev.slice(0, lastIdx);
        }
        return prev;
      });
      setError(null);
      sendMessage(lastUserMsg.content, authToken, user);
    }
  }, [messages, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setActivity(null);
  }, []);

  return {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    activity,
    error,
    isLoading,
    sendMessage,
    retry,
    clearMessages,
    setError,
  };
}

// Test
