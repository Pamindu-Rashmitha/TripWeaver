"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ActivityIndicatorProps {
  activity: string;
  className?: string;
}

export function ActivityIndicator({
  activity,
  className,
}: ActivityIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      {/* Animated dots */}
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
      </div>
      {/* Activity text with shimmer */}
      <span className="text-sm text-muted-foreground dark:text-gray-400 italic">
        {activity}
      </span>
    </div>
  );
}
