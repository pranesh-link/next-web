"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createGlobalStyle } from "styled-components";

type ThemePreference = "light" | "dark" | "system";

interface FinanceThemeContextType {
  isDark: boolean;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setThemePreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = "luvverse-theme";

const ThemeContext = createContext<FinanceThemeContextType>({
  isDark: false,
  themePreference: "system",
  toggleTheme: () => {},
  setThemePreference: () => {},
});

export const useFinanceTheme = () => useContext(ThemeContext);

const FinanceGlobalStyle = createGlobalStyle<{ $isDark: boolean }>`
  .finance-app {
    ${(p) =>
      p.$isDark
        ? `
    --bg: #0f1117;
    --bg-elevated: #1a1d27;
    --surface: rgba(255, 255, 255, 0.04);
    --surface-hover: rgba(255, 255, 255, 0.06);
    --input-bg: #1a1d27;
    --border: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.15);
    --text: #e4e4e7;
    --text-dim: #a1a1aa;
    --text-muted: #71717a;
    --accent: #60a5fa;
    --accent-light: #93c5fd;
    --success: #4ade80;
    --danger: #f87171;
    --warning: #fbbf24;
    --chart-income: #4ade80;
    --chart-expense: #f87171;
    --chart-savings: #60a5fa;
    color-scheme: dark;
    `
        : `
    --bg: #f8fafc;
    --bg-elevated: #ffffff;
    --surface: rgba(0, 0, 0, 0.03);
    --surface-hover: rgba(0, 0, 0, 0.05);
    --input-bg: #ffffff;
    --border: rgba(0, 0, 0, 0.10);
    --border-strong: rgba(0, 0, 0, 0.15);
    --text: #1a1a2e;
    --text-dim: #52525b;
    --text-muted: #94a3b8;
    --accent: #3b82f6;
    --accent-light: #3b82f6;
    --success: #16a34a;
    --danger: #dc2626;
    --warning: #d97706;
    --chart-income: #22c55e;
    --chart-expense: #ef4444;
    --chart-savings: #3b82f6;
    color-scheme: light;
    `}

    font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    min-height: 100vh;
    background: var(--bg);
    color: var(--text);

    *, *::before, *::after {
      box-sizing: border-box;
    }

    ::selection {
      background: ${(p) =>
        p.$isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(59, 130, 246, 0.3)"};
      color: var(--text);
    }

    scrollbar-width: thin;
    scrollbar-color: var(--border-strong) transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-strong);
      border-radius: 3px;
    }
  }
`;

/** Resolves whether dark mode is active based on preference and system setting. */
function resolveIsDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const FinanceThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const pref = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
    setThemePreferenceState(pref);
    setIsDark(resolveIsDark(pref));
  }, []);

  useEffect(() => {
    if (themePreference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themePreference]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref);
    setThemePreferenceState(pref);
    setIsDark(resolveIsDark(pref));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(isDark ? "light" : "dark");
  }, [isDark, setThemePreference]);

  return (
    <ThemeContext.Provider value={{ isDark, themePreference, toggleTheme, setThemePreference }}>
      <FinanceGlobalStyle $isDark={isDark} />
      <div className="finance-app">
        {children}
        <div id="finance-portal-root" />
      </div>
    </ThemeContext.Provider>
  );
};
