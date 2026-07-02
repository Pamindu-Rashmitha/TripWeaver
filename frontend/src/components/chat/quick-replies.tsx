"use client";

import React from "react";
import { Plane, Hotel, MapPin, Compass } from "lucide-react";

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
    icon: Plane,
    label: "Flights CMB → BKK",
    message: "Search flights from CMB to BKK",
    color: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/50",
  },
  {
    icon: MapPin,
    label: "Show all hotels",
    message: "Show me all available hotels",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
  },
  {
    icon: Compass,
    label: "All flights",
    message: "Show me all available flights",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50",
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
