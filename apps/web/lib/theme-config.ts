// Конфигурация тем для лендинга
// Можно расширять, добавляя новые темы

export type ThemeVariant = "pixel" | "modern" | "minimal" | "gradient";

export interface ThemeConfig {
  name: string;
  description: string;
  preview: string;
}

export const themeConfigs: Record<ThemeVariant, ThemeConfig> = {
  pixel: {
    name: "Pixel",
    description: "Технологичный стиль с терминальным дизайном",
    preview: "#0a0a0a",
  },
  modern: {
    name: "Modern",
    description: "Современный светлый дизайн",
    preview: "#ffffff",
  },
  minimal: {
    name: "Minimal",
    description: "Чистый минималистичный стиль",
    preview: "#fafafa",
  },
  gradient: {
    name: "Gradient",
    description: "Темная тема с градиентами",
    preview: "#0f172a",
  },
};

// Получение темы из env (для статической сборки)
export function getDefaultTheme(): ThemeVariant {
  const envTheme = process.env.NEXT_PUBLIC_LANDING_THEME as ThemeVariant;
  if (envTheme && themeConfigs[envTheme]) {
    return envTheme;
  }
  return "pixel";
}
