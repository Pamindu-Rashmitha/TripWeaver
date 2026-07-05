"use client";

import React from "react";
import { Bus, TrainFront, Car, Ship, ExternalLink } from "lucide-react";
import type { TransportOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransportCardProps {
  transport: TransportOption;
  className?: string;
}

function getTransportIcon(type?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("train") || t.includes("metro") || t.includes("subway") || t.includes("rail")) {
    return TrainFront;
  }
  if (t.includes("ferry") || t.includes("boat")) {
    return Ship;
  }
  if (t.includes("taxi") || t.includes("car") || t.includes("ride") || t.includes("tuk")) {
    return Car;
  }
  return Bus; // default for bus, general
}

export function TransportCard({ transport, className }: TransportCardProps) {
  const Icon = getTransportIcon(transport.transportType);

  return (
    <a
      href={transport.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-violet-200/50 dark:border-violet-800/30 bg-white dark:bg-[#1e2028] p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/10 dark:hover:shadow-violet-500/5 no-underline",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
            <Icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground dark:text-white truncate text-sm">
              {transport.title}
            </h3>
            {transport.source && (
              <p className="text-[11px] text-muted-foreground dark:text-gray-500 truncate">
                {transport.source}
              </p>
            )}
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Description */}
      {transport.description && (
        <p className="mt-2 text-xs text-muted-foreground dark:text-gray-400 line-clamp-2 leading-relaxed">
          {transport.description}
        </p>
      )}

      {/* Type + City badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {transport.transportType && transport.transportType !== "general" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            {transport.transportType}
          </span>
        )}
        {transport.city && (
          <span className="rounded-full bg-gray-100 dark:bg-[#2a2d37] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
            {transport.city}
          </span>
        )}
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
