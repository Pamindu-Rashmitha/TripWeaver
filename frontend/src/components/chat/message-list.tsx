"use client";

import React, { useRef, useEffect } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { ActivityIndicator } from "./activity-indicator";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[];
  activity?: string | null;
  className?: string;
  onBookingAction?: (message: string) => void;
  onRetry?: () => void;
}

export function MessageList({ messages, activity, className, onBookingAction, onRetry }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or content streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity]);

  // Find the index of the last assistant message to show retry only on it
  const lastAssistantIdx = messages.reduce(
    (acc, msg, idx) => (msg.role === "assistant" ? idx : acc),
    -1
  );

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 custom-scrollbar",
        className
      )}
    >
      {messages.map((msg, idx) => (
        <div key={msg.id} className="group">
          <MessageBubble
            message={msg}
            onBookingAction={onBookingAction}
            onRetry={idx === lastAssistantIdx ? onRetry : undefined}
          />
        </div>
      ))}
      {activity && <ActivityIndicator activity={activity} />}
      <div ref={bottomRef} />
    </div>
  );
}
