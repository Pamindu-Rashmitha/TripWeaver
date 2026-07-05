"use client";

import React from "react";
import { Compass, ExternalLink, Tag } from "lucide-react";
import type { Activity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: Activity;
  className?: string;
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
  return (
    <a
      href={activity.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-white dark:bg-[#1e2028] p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5 no-underline",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
            <Compass className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground dark:text-white truncate text-sm">
              {activity.title}
            </h3>
            {activity.source && (
              <p className="text-[11px] text-muted-foreground dark:text-gray-500 truncate">
                {activity.source}
              </p>
            )}
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Description */}
      {activity.description && (
        <p className="mt-2 text-xs text-muted-foreground dark:text-gray-400 line-clamp-2 leading-relaxed">
          {activity.description}
        </p>
      )}

      {/* Category + City */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {activity.category && activity.category !== "general" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Tag className="h-2.5 w-2.5" />
            {activity.category}
          </span>
        )}
        {activity.city && (
          <span className="rounded-full bg-gray-100 dark:bg-[#2a2d37] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
            {activity.city}
          </span>
        )}
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
