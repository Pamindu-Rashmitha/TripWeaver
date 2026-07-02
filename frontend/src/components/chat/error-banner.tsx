"use client";

import React from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
      <span className="flex-1 text-red-700 dark:text-red-300">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-0.5 text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
