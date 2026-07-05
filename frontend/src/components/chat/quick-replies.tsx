"use client";

import React from "react";
import { Plane, Hotel, MapPin, Compass, Bus, CloudSun, Ticket } from "lucide-react";

interface QuickRepliesProps {
  onSelect: (message: string) => void;
}

const suggestions = [
  {
    icon: Hotel,
    label: "Hotels in Bangkok",
    message: "Show me hotels in Bangkok",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
  },
  {
    icon: Ticket,
    label: "Activities in Bangkok",
    message: "What are the best activities and things to do in Bangkok?",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
  },
  {
    icon: Bus,
    label: "Transport in Singapore",
    message: "How do I get around Singapore? What local transport is available?",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50",
  },
  {
    icon: CloudSun,
    label: "Weather in Tokyo",
    message: "What's the current weather in Tokyo?",
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50",
  },
];

export function QuickReplies({ onSelect }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.message)}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all hover:scale-[1.03] hover:shadow-md active:scale-[0.98] ${item.bg}`}
        >
          <item.icon className={`h-4 w-4 ${item.color}`} />
          <span className="text-foreground dark:text-gray-200">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
