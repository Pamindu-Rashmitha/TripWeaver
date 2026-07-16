"use client";

import React from "react";
import { Star, MapPin, Wifi, Utensils } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HotelCardProps {
  hotel: Hotel;
  className?: string;
  onBook?: (message: string) => void;
}

export function HotelCard({ hotel, className, onBook }: HotelCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3.5 w-3.5",
          i < Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : "fill-transparent text-gray-300 dark:text-gray-600"
        )}
      />
    ));
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-white dark:bg-[#1e2028] p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 dark:hover:shadow-amber-500/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground dark:text-white truncate text-sm">
            {hotel.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground dark:text-gray-400">
            <MapPin className="h-3 w-3" />
            <span>{hotel.city}</span>
          </div>
        </div>
        {/* Price badge */}
        <div className="shrink-0 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-right">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
            ${hotel.pricePerNight}
          </p>
          <p className="text-[10px] text-amber-500/70 dark:text-amber-500/50">
            /night
          </p>
        </div>
      </div>

      {/* Rating */}
      <div className="mt-2 flex items-center gap-1">
        {renderStars(hotel.rating ?? 0)}
        <span className="ml-1 text-xs text-muted-foreground dark:text-gray-500">
          {hotel.rating ?? 0}
        </span>
      </div>

      {/* Room types */}
      {hotel.roomTypes && hotel.roomTypes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hotel.roomTypes.map((type) => (
            <span
              key={type}
              className="rounded-full bg-gray-100 dark:bg-[#2a2d37] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-400"
            >
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Amenities icons */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-muted-foreground dark:text-gray-500">
          <Wifi className="h-3.5 w-3.5" />
          <Utensils className="h-3.5 w-3.5" />
          <span className="text-[11px]">
            +{hotel.amenities.length} amenities
          </span>
        </div>
      )}

      {/* Book button */}
      {onBook && (
        <div className="mt-3 pt-3 border-t border-amber-200/30 dark:border-amber-800/20">
          <button
            onClick={() => onBook(`Book hotel ${hotel.name} in ${hotel.city} for me`)}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold py-2 px-3 transition-colors duration-200"
          >
            Book this hotel
          </button>
        </div>
      )}

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
