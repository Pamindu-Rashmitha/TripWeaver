"use client";

import React from "react";
import { Compass } from "lucide-react";
import { QuickReplies } from "./quick-replies";

interface EmptyStateProps {
  onSuggestionSelect: (message: string) => void;
}

export function EmptyState({ onSuggestionSelect }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-57 px-4 py-16">

      {/* Heading */}
      <div className="text-center space-y-2 mt-16">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-white">
          Where would you like to go?
        </h1>
        <p className="text-sm text-muted-foreground dark:text-gray-400 max-w-md">
          Search hotels, book flights, discover activities, find local transport,
          and check weather forecasts with TripWeaver AI.
        </p>
      </div>

      {/* Quick suggestions */}
      <QuickReplies onSelect={onSuggestionSelect} />
    </div>
  );
}
