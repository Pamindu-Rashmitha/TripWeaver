"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Brain, Target, Wrench, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThinkingStep } from "@/lib/types";

interface ThinkingPanelProps {
  steps: ThinkingStep[];
  className?: string;
}

export function ThinkingPanel({ steps, className }: ThinkingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("mb-2 w-full", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-md bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50"
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span>Thought for {steps.length} steps</span>
      </button>

      {isExpanded && (
        <div className="mt-2 pl-3 ml-2 flex flex-col gap-3 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                {step.type === "intent" && (
                  <>
                    <span>Detected intent: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{step.intent}</span></span>
                  </>
                )}
                {step.type === "activity" && (
                  <>
                    <span>{step.status}</span>
                  </>
                )}
                {step.type === "tool_call" && (
                  <>
                    <span>Called <span className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">{step.tool}</span></span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
