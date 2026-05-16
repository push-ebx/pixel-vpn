# Мульти-лендинг система

## Структура

```
app/
├── (landing)/                    # Группа роутов для лендингов
│   ├── globals.css              # Общие стили для лендингов
│   ├── layout.tsx               # Базовый layout
│   ├── nova-vpn/                # Лендинг 1: Nova VPN
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── NovaHeader.tsx
│   │       ├── NovaHero.tsx
│   │       ├── NovaStats.tsx
│   │       ├── NovaFeatures.tsx
│   │       ├── NovaHowItWorks.tsx
│   │       ├── NovaPricing.tsx
│   │       ├── NovaTestimonials.tsx
│   │       ├── NovaFAQ.tsx
│   │       ├── NovaCTA.tsx
│   │       └── NovaFooter.tsx
│   └── [brand-name]/            # Лендинг 2: новый бренд
│       ├── page.tsx
│       └── components/
│           └── ...
└── (main)/                      # Основное приложение
    ├── page.tsx                 # Pixel VPN лендинг
    ├── dashboard/
    ├── login/
    └── register/
```

## Принцип работы

1. **Общая бизнес-логика** - API, auth, types находятся в корне `app/`
2. **Изолированные лендинги** - каждый лендинг в своей папке со своими компонентами
3. **Route Groups** - `(landing)` и `(main)` позволяют иметь разные layouts
4. **Переиспользование** - UI компоненты (Button, Card, etc.) в `components/ui/`

## Как создать новый лендинг

### Шаг 1: Создать структуру

```bash
mkdir -p "app/(landing)/your-brand/components"
```

### Шаг 2: Создать компоненты

Скопируйте структуру из `nova-vpn/` и измените:
- Название бренда
- Цвета
- Тексты
- Изображения
- Структуру секций (если нужно)

### Шаг 3: Создать page.tsx

```tsx
// app/(landing)/your-brand/page.tsx
import type { Metadata } from "next";
import { YourHeader } from "./components/YourHeader";
import { YourHero } from "./components/YourHero";
// ... другие компоненты

export const metadata: Metadata = {
  title: "Your Brand — описание",
  description: "...",
};

export default function YourBrandPage() {
  return (
    <div className="min-h-screen">
      <YourHeader />
      <main>
        <YourHero />
        <YourFeatures />
        <YourPricing />
        {/* ... */}
      </main>
      <YourFooter />
    </div>
  );
}
```

### Шаг 4: Деплой на отдельный домен

Для деплоя на разные домены используйте:

**Вариант 1: Vercel**
```json
// vercel.json для каждого домена
{
  "rewrites": [
    { "source": "/", "destination": "/nova-vpn" }
  ]
}
```

**Вариант 2: Отдельные билды**
```bash
# Сборка с кастомным конфигом
BRAND=nova next build --config next.config.nova.js
```

**Вариант 3: Next.js Middleware**
```ts
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host");
  
  if (hostname === "novavpn.com") {
    return NextResponse.rewrite(new URL("/nova-vpn", request.url));
  }
  
  return NextResponse.next();
}
```

## Текущие лендинги

### 1. Nova VPN (nova-vpn)
- **URL**: `/nova-vpn`
- **Стиль**: Modern SaaS
- **Цвета**: Blue/Indigo
- **Секции**: Hero, Stats, Features, HowItWorks, Pricing, Testimonials, FAQ, CTA, Footer
- **Особенности**: Градиенты, карточки, современный дизайн

### 2. Pixel VPN (main)
- **URL**: `/`
- **Стиль**: Tech/Pixel
- **Цвета**: Dark theme, #5674d6
- **Секции**: Hero, Features, Clients, Footer
- **Особенности**: Терминальный стиль, сетка

## Рекомендации

1. **Уникальность** - каждый лендинг должен иметь свою структуру и дизайн
2. **SEO** - уникальные title, description, keywords для каждого
3. **Брендирование** - свои логотипы, цвета, шрифты
4. **Ссылки** - ведут на общие страницы (/login, /register, /dashboard)
5. **Аналитика** - разные tracking codes для каждого домена

## Пример создания третьего лендинга

```tsx
// app/(landing)/flash-vpn/components/FlashHeader.tsx
// Минималистичный дизайн с неоновыми акцентами

// app/(landing)/flash-vpn/components/FlashHero.tsx
// Полноэкранное видео фон + крупная типографика

// app/(landing)/flash-vpn/page.tsx
// Только Hero + Pricing + Footer (короткий лендинг)
```

## Общие компоненты

Все лендинги могут использовать:
- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Modal.tsx`
- `components/ui/Toast.tsx`
- `lib/api.ts` - API клиент
- `lib/auth.ts` - Авторизация
- `lib/utils.ts` - Утилиты

## Скрипты сборки

```json
// package.json
{
  "scripts": {
    "build:nova": "cross-env BRAND=nova next build",
    "build:pixel": "cross-env BRAND=pixel next build",
    "build:all": "npm run build:nova && npm run build:pixel"
  }
}
```
