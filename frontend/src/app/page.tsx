"use client";

import { useRef } from "react";
import { Header } from "@/components/layout/header";
import { ChatContainer } from "@/components/chat/chat-container";

export default function Home() {

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Header onClearChat={handleClearChat} />

      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
}
