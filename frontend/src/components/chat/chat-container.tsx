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
    retry,
    setError,
  } = useChatStream();

  const hasMessages = messages.length > 0;

  // Wrap sendMessage to include the auth token and user info
  const sendMessage = useCallback(async (message: string) => {
    const token = await getToken();
    rawSendMessage(message, token ?? undefined, user ?? undefined);
  }, [rawSendMessage, getToken, user]);

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
              onRetry={retry}
            />
          </div>
        ) : (
          <EmptyState onSuggestionSelect={sendMessage} />
        )}
      </div>

      {/* Bottom input area */}
      <div className="shrink-0 bg-background/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-t border-border/40 dark:border-white/5 px-4 pb-4 pt-2 md:px-8">
        {/* Centered content wrapper */}
        <div className="mx-auto w-full max-w-3xl">


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

