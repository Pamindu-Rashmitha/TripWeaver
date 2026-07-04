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
}

export function MessageList({ messages, activity, className }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or content streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity]);

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar",
        className
      )}
    >
      {messages.map((msg) => (
        <div key={msg.id} className="group">
          <MessageBubble message={msg} />
        </div>
      ))}
      {activity && <ActivityIndicator activity={activity} />}
      <div ref={bottomRef} />
    </div>
  );
}

