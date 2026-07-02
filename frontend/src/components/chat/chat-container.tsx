"use client";

import React from "react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";
import { MessageList } from "./message-list";
import { EmptyState } from "./empty-state";
import { ActivityIndicator } from "./activity-indicator";
import { ErrorBanner } from "./error-banner";
import { QuickReplies } from "./quick-replies";

export function ChatContainer() {
  const {
    messages,
    activity,
    error,
    isLoading,
    sendMessage,
    retry,
    setError,
  } = useChatStream();

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <div className="mx-auto h-full w-full max-w-4xl">
            <MessageList messages={messages} className="h-full" />
          </div>
        ) : (
          <EmptyState onSuggestionSelect={sendMessage} />
        )}
      </div>

      {/* Bottom input area */}
      <div className="shrink-0 bg-background/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-t border-border/40 dark:border-white/5 px-4 pb-4 pt-2 md:px-8">
        {/* Centered content wrapper */}
        <div className="mx-auto w-full max-w-3xl">
          {/* Activity indicator */}
          {activity && <ActivityIndicator activity={activity} className="mb-2 w-fit" />}

          {/* Error banner */}
          {error && (
            <ErrorBanner
              message={error}
              onRetry={retry}
              onDismiss={() => setError(null)}
              className="mb-2"
            />
          )}

          {/* PromptBox */}
          <PromptBox
            onSendMessage={sendMessage}
            disabled={isLoading}
          />

          {/* Quick replies below input when there are messages */}
          {hasMessages && !isLoading && (
            <div className="mt-3">
              <QuickReplies onSelect={sendMessage} />
            </div>
          )}

          {/* Footer */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground/60 dark:text-gray-600">
            TripWeaver AI may produce inaccurate information. Verify important
            details before booking.
          </p>
        </div>
      </div>
    </div>
  );
}
