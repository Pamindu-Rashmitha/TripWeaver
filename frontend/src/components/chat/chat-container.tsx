"use client";

import React, { useCallback } from "react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useAppAuth } from "@/hooks/use-auth";
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";
import { MessageList } from "./message-list";
import { EmptyState } from "./empty-state";
import { ErrorBanner } from "./error-banner";


export function ChatContainer() {
  const { isSignedIn, getToken, user } = useAppAuth();

  const {
    messages,
    activity,
    error,
    isLoading,
    sendMessage: rawSendMessage,
    retry: rawRetry,
    setError,
  } = useChatStream();

  const hasMessages = messages.length > 0;

  // Wrap sendMessage to include the auth token and user info
  const sendMessage = useCallback(async (message: string) => {
    const token = await getToken();
    rawSendMessage(message, token ?? undefined, user ?? undefined);
  }, [rawSendMessage, getToken, user]);

  const handleRetry = useCallback(async () => {
    const token = await getToken();
    rawRetry(token ?? undefined, user ?? undefined);
  }, [rawRetry, getToken, user]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <div className="mx-auto h-full w-full max-w-3xl">
            <MessageList
              messages={messages}
              activity={activity}
              className="h-full"
              onBookingAction={sendMessage}
              onRetry={handleRetry}
            />
          </div>
        ) : (
          <EmptyState onSuggestionSelect={sendMessage} />
        )}
      </div>

      {/* Bottom input area */}
      <div className="shrink-0 bg-transparent border-t border-border/40 dark:border-white/5 px-4 pb-4 pt-2 md:px-8">
        {/* Centered content wrapper */}
        <div className="mx-auto w-full max-w-3xl">


          {/* Error banner */}
          {error && (
            <ErrorBanner
              message={error}
              onRetry={handleRetry}
              onDismiss={() => setError(null)}
              className="mb-2"
            />
          )}

          {/* PromptBox */}
          <PromptBox
            onSendMessage={sendMessage}
            disabled={isLoading}
          />

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

