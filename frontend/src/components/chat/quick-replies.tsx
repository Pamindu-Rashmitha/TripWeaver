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
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-950/20 border-gray-300 dark:border-gray-800/80",
  },
  {
    icon: MapPin,
    label: "Activities in Paris",
    message: "What are the best activities and things to do in Paris?",
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-950/20 border-gray-300 dark:border-gray-800/80",
  },
  {
    icon: Bus,
    label: "Transport in Singapore",
    message: "How do I get around Singapore? What local transport is available?",
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-950/20 border-gray-300 dark:border-gray-800/80",
  }

];

export function QuickReplies({ onSelect }: QuickRepliesProps) {
  return (
    <div className="flex w-full overflow-x-auto gap-2 pb-2 sm:pb-0 sm:flex-wrap sm:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {suggestions.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.message)}
          className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all hover:scale-[1.03] hover:shadow-md active:scale-[0.98] ${item.bg}`}
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
