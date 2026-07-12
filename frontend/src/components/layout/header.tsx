"use client";

import React from "react";
import { Sun, Moon, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  UserButton,
} from "@clerk/nextjs";
import { useAppAuth } from "@/hooks/use-auth";

interface HeaderProps {
  onClearChat?: () => void;
}

export function Header({ onClearChat }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isSignedIn, isLoaded } = useAppAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 dark:border-white/5 px-4 md:px-6 backdrop-blur-md bg-background/80 dark:bg-[#0f1117]/80">
      <div className="flex items-center gap-2.5">
        <span className="text-base font-semibold tracking-tight text-foreground dark:text-white">
          TripWeaver
        </span>
        <span className="hidden sm:inline-block rounded-full bg-indigo-100 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
          AI
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onClearChat && (
          <button
            onClick={onClearChat}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-[#1e2028] transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-[#1e2028] transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Clerk Auth UI */}
        {isLoaded && (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
        )}
      </div>
    </header>
  );
}
