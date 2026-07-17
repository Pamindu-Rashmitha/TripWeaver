"use client";

import React, { useCallback, useEffect } from "react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useAppAuth } from "@/hooks/use-auth";
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";
import { MessageList } from "./message-list";
import { EmptyState } from "./empty-state";
import { QuickReplies } from "./quick-replies";
import { ErrorBanner } from "./error-banner";
import { ENDPOINTS } from "@/lib/api";

interface ChatContainerProps {
  activeConversationId: string | null;
  onConversationChange: (id: string | null) => void;
}

export function ChatContainer({ activeConversationId, onConversationChange }: ChatContainerProps) {
  const { isSignedIn, getToken, user } = useAppAuth();

  const {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    activity,
    error,
    isLoading,
    sendMessage: rawSendMessage,
    retry: rawRetry,
    setError,
    stopGeneration,
  } = useChatStream(activeConversationId || undefined);

  const prevConversationIdRef = React.useRef<string | null>(conversationId);

  // Sync conversationId to parent when new chat is started
  useEffect(() => {
    if (conversationId && conversationId !== prevConversationIdRef.current) {
      onConversationChange(conversationId);
    }
    prevConversationIdRef.current = conversationId;
  }, [conversationId, onConversationChange]);

  // Sync activeConversationId downwards
  useEffect(() => {
    if (activeConversationId === null) {
      setConversationId(null);
      setMessages([]);
    } else if (activeConversationId !== conversationId) {
      setConversationId(activeConversationId);
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const loadMessages = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${ENDPOINTS.conversations}/${id}/messages`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
        setMessages(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

          {!hasMessages && (
            <div className="mb-4">
              <QuickReplies onSelect={sendMessage} />
            </div>
          )}

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
            isLoading={isLoading}
            onStop={stopGeneration}
          />

          {/* Footer */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground/60 dark:text-gray-500">
            TripWeaver AI may produce inaccurate information. Verify important
            details before booking.
          </p>
        </div>
      </div>
    </div>
  );
}

