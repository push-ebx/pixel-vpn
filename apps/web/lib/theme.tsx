"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeVariant = "pixel" | "modern" | "minimal" | "gradient";

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "landing-theme";

// Определения тем с CSS переменными
const themeStyles: Record<ThemeVariant, string> = {
  // Исходная pixel тема
  pixel: `
    --background: #0a0a0a;
    --card: #141414;
    --card-hover: #1a1a1a;
    --accent: #5674d6;
    --accent-hover: #6a86e4;
    --text-primary: #ddd;
    --text-secondary: #8a8a8a;
    --success: #5674d6;
    --error: #ef4444;
    --border: #2a2a2a;
    --border-radius: 4px;
    --shadow: none;
    --font-family: "SF Mono", "JetBrains Mono", "Fira Code", "Consolas", monospace;
  `,

  // Современная светлая тема
  modern: `
    --background: #ffffff;
    --card: #f8fafc;
    --card-hover: #f1f5f9;
    --accent: #3b82f6;
    --accent-hover: #2563eb;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --success: #10b981;
    --error: #ef4444;
    --border: #e2e8f0;
    --border-radius: 12px;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `,

  // Минималистичная тема
  minimal: `
    --background: #fafafa;
    --card: #ffffff;
    --card-hover: #f5f5f5;
    --accent: #171717;
    --accent-hover: #404040;
    --text-primary: #171717;
    --text-secondary: #737373;
    --success: #22c55e;
    --error: #dc2626;
    --border: #e5e5e5;
    --border-radius: 2px;
    --shadow: none;
    --font-family: "Inter", system-ui, -apple-system, sans-serif;
  `,

  // Градиентная тема
  gradient: `
    --background: #0f172a;
    --card: rgba(255, 255, 255, 0.05);
    --card-hover: rgba(255, 255, 255, 0.1);
    --accent: #8b5cf6;
    --accent-hover: #a78bfa;
    --text-primary: #ffffff;
    --text-secondary: #94a3b8;
    --success: #10b981;
    --error: #f43f5e;
    --border: rgba(255, 255, 255, 0.1);
    --border-radius: 16px;
    --shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5);
    --font-family: "Inter", system-ui, sans-serif;
  `,
};

export function ThemeProvider({
  children,
  defaultTheme = "pixel"
}: {
  children: ReactNode;
  defaultTheme?: ThemeVariant;
}) {
  const [theme, setThemeState] = useState<ThemeVariant>(defaultTheme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Восстановление темы из localStorage (только на клиенте)
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant | null;
    if (stored && themeStyles[stored]) {
      setThemeState(stored);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Применение CSS переменных темы
    const root = document.documentElement;
    root.style.cssText = themeStyles[theme];

    // Добавление data-атрибута для специфичных стилей
    root.setAttribute("data-theme", theme);

    // Сохранение в localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, isReady]);

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isReady }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Компонент для переключения тем
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const themes: { value: ThemeVariant; label: string }[] = [
    { value: "pixel", label: "Pixel" },
    { value: "modern", label: "Modern" },
    { value: "minimal", label: "Minimal" },
    { value: "gradient", label: "Gradient" },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-[var(--text-secondary)]">Тема:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeVariant)}
        className="px-2 py-1 text-xs bg-[var(--card)] border border-[var(--border)] rounded-[var(--border-radius)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        {themes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
