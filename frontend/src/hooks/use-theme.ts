"use client";

import { useEffect, useState, useCallback } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Check localStorage or default to dark
    const stored = localStorage.getItem("tripweaver-theme");
    const initial = stored === "light" ? "light" : "dark";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = useCallback((newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("tripweaver-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
