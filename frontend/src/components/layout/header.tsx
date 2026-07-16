"use client";

import React from "react";
import { Sun, Moon, Trash2, MessageSquare } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { UserButton } from "@clerk/nextjs";
import { useAppAuth } from "@/hooks/use-auth";
import { AnimatedDock, DockItemData } from "@/components/ui/animated-dock";

interface HeaderProps {
  onClearChat?: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ onClearChat, onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isLoaded } = useAppAuth();

  const dockItems: DockItemData[] = [];

  if (onClearChat) {
    dockItems.push({
      onClick: onClearChat,
      Icon: <Trash2 size={15} />,
    });
  }

  if (onToggleSidebar) {
    dockItems.push({
      onClick: onToggleSidebar,
      Icon: <MessageSquare size={15} />,
    });
  }

  dockItems.push({
    onClick: toggleTheme,
    Icon: theme === "dark" ? <Sun size={15} /> : <Moon size={15} />,
  });

  if (isLoaded) {
    dockItems.push({
      Icon: <UserButton appearance={{ elements: { avatarBox: "h-full w-full rounded-full" } }} />,
    });
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 dark:border-white/5 px-4 md:px-6 bg-transparent z-50">
      <div className="flex items-center gap-0.5 rounded-2xl bg-secondary/60 border border-primary/10 shadow-sm px-3 py-1.5 backdrop-blur-sm transition-opacity hover:opacity-80">
        <span className="text-base font-semibold tracking-tight text-foreground dark:text-white">
          TripWeaver
        </span>
        <span className="inline-block rounded-full bg-indigo-100 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
          AI
        </span>
      </div>

      <div className="flex items-center">
        <AnimatedDock items={dockItems} className="mx-0" />
      </div>
    </header>
  );
}
