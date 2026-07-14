"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { PenBoxIcon, Plus, ChevronRight, X, Trash2 } from "lucide-react";
import { ENDPOINTS } from "@/lib/api";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string | null) => void;
  activeConversationId: string | null;
}

export function ChatSidebar({ isOpen, onClose, onSelectConversation, activeConversationId }: ChatSidebarProps) {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(ENDPOINTS.conversations, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`${ENDPOINTS.conversations}/${id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
          onSelectConversation(null);
        }
      } else {
        console.error("Failed to delete conversation");
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col transform transition-transform duration-300">
        <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1/2">
            <span className="text-base font-semibold tracking-tight text-foreground dark:text-white">
              TripWeaver
            </span>
            <span className="inline-block rounded-full bg-indigo-100 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
              AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              onSelectConversation(null);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md transition-colors text-sm font-medium"
          >
            <PenBoxIcon className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-zinc-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-500">No past chats found.</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`w-full px-3 py-1 rounded-md flex items-center justify-between group transition-colors ${activeConversationId === conv.id
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
              >
                <button
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  className="flex-1 text-left truncate text-sm py-1.5"
                >
                  {conv.title}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-4 h-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${activeConversationId === conv.id ? "!opacity-100 text-zinc-400" : "text-zinc-300 dark:text-zinc-600"
                    }`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
