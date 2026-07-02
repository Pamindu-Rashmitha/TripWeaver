"use client";

import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  Hotel,
  Flight,
} from "@/lib/types";
import { ENDPOINTS } from "@/lib/api";

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
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

    // Create placeholder assistant message for streaming
    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    setActivity("Analyzing your request…");

    // Abort previous request if any
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(ENDPOINTS.chatStream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete last line

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            try {
              const data = JSON.parse(dataStr);

              switch (eventType) {
                case "activity":
                  setActivity(data.status);
                  break;

                case "token":
                  accumulatedContent += data.token;
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
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, flights: accumulatedFlights }
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

      // Ensure streaming flag is cleared even if "done" event was missed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(errorMessage);

      // Remove the empty assistant placeholder on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId && !last.content) {
          return prev.slice(0, -1);
        }
        // Mark as not streaming
        return prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        );
      });
    } finally {
      setIsLoading(false);
      setActivity(null);
      abortRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    // Find the last user message and resend it
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the last assistant message (the failed one)
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (prev[lastIdx]?.role === "assistant") {
          return prev.slice(0, lastIdx);
        }
        return prev;
      });
      setError(null);
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setActivity(null);
  }, []);

  return {
    messages,
    activity,
    error,
    isLoading,
    sendMessage,
    retry,
    clearMessages,
    setError,
  };
}
