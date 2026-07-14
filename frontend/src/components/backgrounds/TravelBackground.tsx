"use client";

import { useTheme } from "@/hooks/use-theme";

export default function TravelBackground() {
  const { theme } = useTheme();

  return (
    <>
      {/* Desktop Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 pointer-events-none opacity-100 hidden md:block"
        style={{
          backgroundImage: theme === "dark" ? "url('/dark-bg.png')" : "url('/light-bg.png')",
        }}
      />
      {/* Mobile Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 pointer-events-none opacity-100 block md:hidden"
        style={{
          backgroundImage: theme === "dark" ? "url('/mobile-dark-bg.png')" : "url('/mobile-light-bg.png')",
        }}
      />
    </>
  );
}
