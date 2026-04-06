// app/providers.tsx
"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useUIStore } from "@/stores/useUIStore";

function ThemeSync() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="kiyoko-theme"
      themes={["light", "dark", "system"]}
    >
      <ThemeSync />
      {children}
    </ThemeProvider>
  );
}