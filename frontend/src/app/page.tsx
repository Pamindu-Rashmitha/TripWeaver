"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ChatContainer } from "@/components/chat/chat-container";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setActiveConversationId(null);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Header 
        onClearChat={handleClearChat} 
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <ChatSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
      />

      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <ChatContainer 
          activeConversationId={activeConversationId}
          onConversationChange={setActiveConversationId}
        />
      </main>
    </div>
  );
}
