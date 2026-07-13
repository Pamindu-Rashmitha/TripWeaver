"use client";

import { useTheme } from "@/hooks/use-theme";

export default function TravelBackground() {
  const { theme } = useTheme();

  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 pointer-events-none opacity-100"
      style={{
        backgroundImage: theme === "dark" ? "url('/dark-bg.png')" : "url('/light-bg.png')",
        backgroundSize: "cover",
      }}
    />
  );
}
