"use client";

import React from "react";
import { Thermometer, Droplets, Wind, Eye, CloudSun } from "lucide-react";
import type { WeatherInfo, WeatherForecast } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeatherCardProps {
  weather: WeatherInfo | WeatherForecast;
  className?: string;
}

function getWeatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  if (c.includes("cloud") && c.includes("few")) return "🌤️";
  if (c.includes("cloud") && c.includes("scatter")) return "⛅";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("rain") && c.includes("heavy")) return "🌧️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌦️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("snow")) return "🌨️";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "🌫️";
  if (c.includes("wind")) return "💨";
  return "🌡️";
}

function isWeatherForecast(w: WeatherInfo | WeatherForecast): w is WeatherForecast {
  return "forecasts" in w;
}

function CurrentWeatherCard({ weather, className }: { weather: WeatherInfo; className?: string }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-sky-200/50 dark:border-sky-800/30 bg-white dark:bg-[#1e2028] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 dark:hover:shadow-sky-500/5",
        className
      )}
    >
      {/* City + Condition */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground dark:text-white text-sm">
            {weather.city}{weather.country ? `, ${weather.country}` : ""}
          </h3>
          <p className="text-xs text-muted-foreground dark:text-gray-400 capitalize mt-0.5">
            {weather.description || weather.condition}
          </p>
        </div>
        <span className="text-3xl" role="img" aria-label={weather.condition}>
          {getWeatherEmoji(weather.condition)}
        </span>
      </div>

      {/* Temperature */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground dark:text-white">
          {Math.round(weather.temperature)}°
        </span>
        <span className="text-sm text-muted-foreground dark:text-gray-400">C</span>
        {weather.feelsLike !== undefined && (
          <span className="ml-2 text-xs text-muted-foreground dark:text-gray-500">
            Feels like {Math.round(weather.feelsLike)}°
          </span>
        )}
      </div>

      {/* Details grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-gray-400">
          <Droplets className="h-3.5 w-3.5 text-sky-400" />
          <span>{weather.humidity}% humidity</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-gray-400">
          <Wind className="h-3.5 w-3.5 text-sky-400" />
          <span>{weather.windSpeed} m/s</span>
        </div>
        {weather.tempMin !== undefined && weather.tempMax !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-gray-400">
            <Thermometer className="h-3.5 w-3.5 text-sky-400" />
            <span>{Math.round(weather.tempMin)}° / {Math.round(weather.tempMax)}°</span>
          </div>
        )}
        {weather.visibility !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-gray-400">
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span>{(weather.visibility / 1000).toFixed(1)} km</span>
          </div>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function ForecastWeatherCard({ weather, className }: { weather: WeatherForecast; className?: string }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-sky-200/50 dark:border-sky-800/30 bg-white dark:bg-[#1e2028] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 dark:hover:shadow-sky-500/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
          <CloudSun className="h-4 w-4 text-sky-500 dark:text-sky-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground dark:text-white text-sm">
            {weather.city}{weather.country ? `, ${weather.country}` : ""} — Forecast
          </h3>
          <p className="text-[11px] text-muted-foreground dark:text-gray-500">
            {weather.forecasts.length}-day forecast
          </p>
        </div>
      </div>

      {/* Forecast rows */}
      <div className="space-y-1.5">
        {weather.forecasts.map((day) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <div
              key={day.date}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-[#2a2d37] transition-colors"
            >
              {/* Day */}
              <div className="w-16 shrink-0">
                <span className="font-medium text-foreground dark:text-white">{dayName}</span>
                <span className="ml-1 text-muted-foreground dark:text-gray-500">{dateLabel}</span>
              </div>

              {/* Emoji */}
              <span className="text-base shrink-0">{getWeatherEmoji(day.condition)}</span>

              {/* Temp range */}
              <div className="flex-1 flex items-center gap-1">
                <span className="font-medium text-foreground dark:text-white">
                  {Math.round(day.tempMax)}°
                </span>
                <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-[#2a2d37] mx-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
                    style={{ width: `${Math.min(100, Math.max(20, ((day.tempMax - day.tempMin) / 30) * 100))}%` }}
                  />
                </div>
                <span className="text-muted-foreground dark:text-gray-500">
                  {Math.round(day.tempMin)}°
                </span>
              </div>

              {/* Humidity */}
              <div className="flex items-center gap-0.5 text-muted-foreground dark:text-gray-500 shrink-0">
                <Droplets className="h-3 w-3" />
                <span>{Math.round(day.humidity)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export function WeatherCard({ weather, className }: WeatherCardProps) {
  if (isWeatherForecast(weather)) {
    return <ForecastWeatherCard weather={weather} className={className} />;
  }
  return <CurrentWeatherCard weather={weather} className={className} />;
}
