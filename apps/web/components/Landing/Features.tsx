"use client";

import { FeaturesPixel } from "./variants/FeaturesPixel";
import { FeaturesModern } from "./variants/FeaturesModern";
import { FeaturesMinimal } from "./variants/FeaturesMinimal";
import { FeaturesGradient } from "./variants/FeaturesGradient";
import { useTheme } from "@/lib/theme";

// Компонент-роутер для Features секции
// Выбирает визуальный вариант в зависимости от текущей темы
export function Features() {
  const { theme, isReady } = useTheme();

  // Пока тема не загружена, показываем pixel (дефолт)
  if (!isReady) {
    return <FeaturesPixel />;
  }

  switch (theme) {
    case "modern":
      return <FeaturesModern />;
    case "minimal":
      return <FeaturesMinimal />;
    case "gradient":
      return <FeaturesGradient />;
    case "pixel":
    default:
      return <FeaturesPixel />;
  }
}
