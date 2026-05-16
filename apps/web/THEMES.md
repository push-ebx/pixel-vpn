# Система тем для лендинга

## Архитектура

Система построена на **CSS Variables + Theme Provider**, что позволяет:
- Сохранить всю бизнес-логику и API
- Изменять только визуальное оформление
- Легко добавлять новые темы
- Переключать темы динамически

## Структура

```
lib/
├── theme.tsx           # ThemeProvider и хук useTheme
└── theme-config.ts     # Конфигурация тем

components/Landing/
├── Hero.tsx            # Роутер компонент
├── Features.tsx        # Роутер компонент
└── variants/           # Варианты для разных тем
    ├── HeroPixel.tsx
    ├── HeroModern.tsx
    ├── HeroMinimal.tsx
    └── HeroGradient.tsx
```

## Текущие темы

| Тема | Описание | Особенности |
|------|----------|-------------|
| `pixel` | Исходный дизайн | Терминальный стиль, темный фон |
| `modern` | Современный светлый | Градиенты, карточки, светлая тема |
| `minimal` | Минимализм | Чистый дизайн, мало декораций |
| `gradient` | Темный с градиентами | Фиолетовые/синие градиенты |

## Использование

### 1. Переключение темы в UI

```tsx
import { ThemeSwitcher } from "@/lib/theme";

<ThemeSwitcher />
```

### 2. Программное переключение

```tsx
import { useTheme } from "@/lib/theme";

const { theme, setTheme } = useTheme();

setTheme("modern");
```

### 3. Создание темизированного компонента

**Вариант А: Роутер (рекомендуется для больших секций)**

```tsx
// components/Landing/Hero.tsx
"use client";

import { HeroPixel } from "./variants/HeroPixel";
import { HeroModern } from "./variants/HeroModern";
import { useTheme } from "@/lib/theme";

export function Hero() {
  const { theme } = useTheme();

  switch (theme) {
    case "modern":
      return <HeroModern />;
    case "minimal":
      return <HeroMinimal />;
    default:
      return <HeroPixel />;
  }
}
```

**Вариант Б: CSS Variables (для мелких компонентов)**

```tsx
// Используйте CSS переменные напрямую
<div className="bg-[var(--background)] text-[var(--text-primary)]">
  Content
</div>
```

### 4. Добавление новой темы

1. **Обновите `lib/theme.tsx`:**

```tsx
const themeStyles: Record<ThemeVariant, string> = {
  // ... существующие темы
  
  mytheme: `
    --background: #...;
    --card: #...;
    --accent: #...;
    // ... остальные переменные
  `,
};
```

2. **Обновите `lib/theme-config.ts`:**

```tsx
export type ThemeVariant = "pixel" | "modern" | "minimal" | "gradient" | "mytheme";

export const themeConfigs: Record<ThemeVariant, ThemeConfig> = {
  // ... существующие темы
  
  mytheme: {
    name: "My Theme",
    description: "Описание темы",
    preview: "#цвет",
  },
};
```

3. **Создайте вариант компонента:**

```tsx
// components/Landing/variants/HeroMytheme.tsx
export function HeroMytheme() {
  return <section>...</section>;
}
```

4. **Добавьте в роутер:**

```tsx
// components/Landing/Hero.tsx
import { HeroMytheme } from "./variants/HeroMytheme";

// в switch:
case "mytheme":
  return <HeroMytheme />;
```

## CSS Переменные

| Переменная | Описание | Пример |
|------------|----------|--------|
| `--background` | Фон страницы | `#0a0a0a` |
| `--card` | Фон карточек | `#141414` |
| `--card-hover` | Ховер карточек | `#1a1a1a` |
| `--accent` | Акцентный цвет | `#5674d6` |
| `--accent-hover` | Ховер акцента | `#6a86e4` |
| `--text-primary` | Основной текст | `#f5f5f5` |
| `--text-secondary` | Вторичный текст | `#8a8a8a` |
| `--success` | Успех | `#5674d6` |
| `--error` | Ошибка | `#ef4444` |
| `--border` | Границы | `#2a2a2a` |
| `--border-radius` | Скругление | `4px` |
| `--shadow` | Тень | `none` |
| `--font-family` | Шрифт | `monospace` |

## Статическая тема (для сборки)

Если нужно зафиксировать тему при сборке:

```bash
# .env.local
NEXT_PUBLIC_LANDING_THEME=modern
```

Тема будет применена по умолчанию, но пользователь сможет переключить.

## Преимущества подхода

1. **Бизнес-логика неизменна** - API, типы, auth остаются теми же
2. **Изоляция изменений** - каждая тема в отдельном файле
3. **Легкое тестирование** - можно переключать темы в runtime
4. **Масштабируемость** - добавление новой темы = 1 файл + конфиг
5. **SEO-friendly** - серверный рендеринг сохраняется
