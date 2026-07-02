"use client";

import React from "react";
import { User, Compass } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { HotelCard } from "./hotel-card";
import { FlightCard } from "./flight-card";
import { CopyButton } from "./copy-button";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-sm">
          <Compass className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%]",
          isUser ? "order-first" : ""
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-indigo-500 text-white dark:bg-indigo-600 rounded-br-md"
              : "bg-gray-100 dark:bg-[#2a2d37] text-foreground dark:text-gray-200 rounded-bl-md"
          )}
        >
          {/* Render content with basic line break support and markdown */}
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {/* Streaming cursor */}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-text-bottom" />
            )}
          </div>
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && message.content && !message.isStreaming && (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 [.group:hover_&]:opacity-100">
            <CopyButton text={message.content} />
          </div>
        )}

        {/* Hotel cards */}
        {message.hotels && message.hotels.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {message.hotels.map((hotel, idx) => (
              <HotelCard key={hotel._id || idx} hotel={hotel} />
            ))}
          </div>
        )}

        {/* Flight cards */}
        {message.flights && message.flights.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {message.flights.map((flight, idx) => (
              <FlightCard key={flight._id || idx} flight={flight} />
            ))}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-[#404040] shadow-sm">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
}
