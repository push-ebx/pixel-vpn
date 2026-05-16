"use client";

import { HeroPixel } from "./variants/HeroPixel";
import { HeroModern } from "./variants/HeroModern";
import { HeroMinimal } from "./variants/HeroMinimal";
import { HeroGradient } from "./variants/HeroGradient";
import { useTheme } from "@/lib/theme";

// Компонент-роутер для Hero секции
// Выбирает визуальный вариант в зависимости от текущей темы
export function Hero() {
  const { theme, isReady } = useTheme();

  // Пока тема не загружена, показываем pixel (дефолт)
  if (!isReady) {
    return <HeroPixel />;
  }

  switch (theme) {
    case "modern":
      return <HeroModern />;
    case "minimal":
      return <HeroMinimal />;
    case "gradient":
      return <HeroGradient />;
    case "pixel":
    default:
      return <HeroPixel />;
  }
}
