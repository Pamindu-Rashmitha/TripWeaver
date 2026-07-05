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
        <Brain className="h-3.5 w-3.5 text-indigo-400" />
        <span>Thought for {steps.length} steps</span>
      </button>

      {isExpanded && (
        <div className="mt-2 pl-3 ml-2 flex flex-col gap-3 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                {step.type === "intent" && (
                  <>
                    <Target className="h-3 w-3 text-emerald-500" />
                    <span>Detected intent: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{step.intent}</span></span>
                  </>
                )}
                {step.type === "activity" && (
                  <>
                    <Activity className="h-3 w-3 text-amber-500" />
                    <span>{step.status}</span>
                  </>
                )}
                {step.type === "tool_call" && (
                  <>
                    <Wrench className="h-3 w-3 text-blue-500" />
                    <span>Called <span className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">{step.tool}</span></span>
                  </>
                )}
              </div>

              {/* Tool input payload if available */}
              {step.type === "tool_call" && step.input && Object.keys(step.input).length > 0 && (
                <div className="ml-5 mt-1 font-mono text-[10px] text-muted-foreground bg-muted/40 rounded p-1.5 overflow-x-auto">
                  {Object.entries(step.input).map(([key, value]) => (
                    <div key={key} className="flex gap-1.5">
                      <span className="text-foreground/70">{key}:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
