"use client";
import React, { createContext, useContext } from "react";
import { createGlobalStyle } from "styled-components";

interface FinanceThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<FinanceThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const useFinanceTheme = () => useContext(ThemeContext);

const FinanceGlobalStyle = createGlobalStyle`
  .finance-app {
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
      background: rgba(59, 130, 246, 0.3);
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

export const FinanceThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isDark = false;
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <FinanceGlobalStyle />
      <div className="finance-app">
        {children}
        <div id="finance-portal-root" />
      </div>
    </ThemeContext.Provider>
  );
};
