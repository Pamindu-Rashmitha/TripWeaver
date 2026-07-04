"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BouncingDots } from "@/components/ui/bouncing-dots";

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
      {/* Animated bouncing dots */}
      <BouncingDots
        dots={3}
        className="w-1 h-1 bg-indigo-400"
      />
      {/* Activity text */}
      <span className="text-sm text-muted-foreground dark:text-gray-400 italic">
        {activity}
      </span>
    </div>
  );
}
