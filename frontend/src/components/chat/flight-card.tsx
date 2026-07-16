"use client";

import React from "react";
import { Plane, Clock, ArrowRight } from "lucide-react";
import type { Flight } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlightCardProps {
  flight: Flight;
  className?: string;
  onBook?: (message: string) => void;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    // Check if the Date is valid
    if (isNaN(d.getTime())) {
      // It's likely a plain time string like "12:15"
      return dateStr;
    }
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return "";
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function FlightCard({ flight, className, onBook }: FlightCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-cyan-200/50 dark:border-cyan-800/30 bg-white dark:bg-[#1e2028] p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/5",
        className
      )}
    >
      {/* Airline + flight number */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/40">
            <Plane className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground dark:text-white">
              {flight.airline}
            </p>
            <p className="text-[11px] text-muted-foreground dark:text-gray-500">
              {flight.flightNumber}
            </p>
          </div>
        </div>
        {/* Price */}
        <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 text-right">
          <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
            ${flight.price}
          </p>
        </div>
      </div>

      {/* Route visualization */}
      <div className="mt-4 flex items-center justify-between">
        {/* Origin */}
        <div className="text-center">
          <p className="text-lg font-bold text-foreground dark:text-white">
            {flight.origin}
          </p>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            {formatTime(flight.departureTime)}
          </p>
          <p className="text-[10px] text-muted-foreground/70 dark:text-gray-500">
            {formatDate(flight.departureTime)}
          </p>
        </div>

        {/* Flight path */}
        <div className="flex flex-1 items-center px-3">
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-300 to-transparent dark:from-cyan-600" />
          <div className="mx-1 flex items-center gap-1">
            <Plane className="h-3.5 w-3.5 rotate-90 text-cyan-400" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-cyan-300 to-transparent dark:from-cyan-600" />
        </div>

        {/* Destination */}
        <div className="text-center">
          <p className="text-lg font-bold text-foreground dark:text-white">
            {flight.destination}
          </p>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            {formatTime(flight.arrivalTime)}
          </p>
          <p className="text-[10px] text-muted-foreground/70 dark:text-gray-500">
            {formatDate(flight.arrivalTime)}
          </p>
        </div>
      </div>

      {/* Duration + seats */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground dark:text-gray-500">
        {flight.duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{flight.duration}</span>
          </div>
        )}
        {flight.seatsAvailable !== undefined && (
          <span>
            {flight.seatsAvailable} seat{flight.seatsAvailable !== 1 ? "s" : ""}{" "}
            left
          </span>
        )}
      </div>

      {/* Book button */}
      {onBook && (
        <div className="mt-3 pt-3 border-t border-cyan-200/30 dark:border-cyan-800/20">
          <button
            onClick={() => onBook(`Book flight ${flight.flightNumber} from ${flight.origin} to ${flight.destination} for me`)}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-semibold py-2 px-3 transition-colors duration-200"
          >
            Book this flight
          </button>
        </div>
      )}

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
