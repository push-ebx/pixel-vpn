# Мульти-лендинг система для VPN сервиса

## 🎯 Что создано

Система позволяет создавать **полностью независимые лендинги** с разными:
- Названиями брендов
- Визуальными стилями
- Структурой секций
- Цветовыми схемами
- Контентом

Все лендинги используют **общую бизнес-логику**: API, авторизацию, дашборд.

## 📁 Структура

```
apps/web/app/
├── (landing)/                    # Группа роутов для лендингов
│   ├── globals.css              # Базовые стили
│   ├── layout.tsx               # Layout группы
│   │
│   ├── nova-vpn/                # 🟦 Лендинг 1: Nova VPN
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── NovaHeader.tsx      # Шапка с логотипом
│   │       ├── NovaHero.tsx        # Hero с дашбордом
│   │       ├── NovaStats.tsx       # Статистика
│   │       ├── NovaFeatures.tsx    # Карточки фич
│   │       ├── NovaHowItWorks.tsx  # 4 шага
│   │       ├── NovaPricing.tsx     # 3 тарифа
│   │       ├── NovaTestimonials.tsx # Отзывы
│   │       ├── NovaFAQ.tsx         # Аккордеон
│   │       ├── NovaCTA.tsx         # Призыв к действию
│   │       └── NovaFooter.tsx      # Футер
│   │
│   └── flash-vpn/               # 🟣 Лендинг 2: Flash VPN
│       ├── page.tsx
│       └── components/
│           ├── FlashHeader.tsx     # Неоновая шапка
│           ├── FlashHero.tsx       # Полноэкранный hero
│           ├── FlashMarquee.tsx    # Бегущая строка
│           ├── FlashFeatures.tsx   # Сетка фич
│           ├── FlashServers.tsx    # Таблица серверов
│           ├── FlashPricing.tsx    # Тарифы
│           ├── FlashDownload.tsx   # Платформы
│           └── FlashFooter.tsx     # Минимальный футер
│
└── (main)/                      # Основное приложение
    ├── page.tsx                 # Pixel VPN (исходный)
    ├── dashboard/
    ├── login/
    └── register/
```

## 🎨 Сравнение лендингов

| Характеристика | Nova VPN | Flash VPN |
|----------------|----------|-----------|
| **Стиль** | Modern SaaS | Cyberpunk/Neon |
| **Цвета** | Blue/Indigo | Purple/Cyan |
| **Шрифт** | Inter | Space Grotesk |
| **Фон** | Светлый | Темный |
| **Секций** | 9 | 7 |
| **Особенности** | Карточки, отзывы, FAQ | Мерцающие эффекты, таблица серверов |
| **Таргет** | Широкая аудитория | Технарская аудитория |
| **URL** | `/nova-vpn` | `/flash-vpn` |

## 🚀 Деплой на разные домены

### Вариант 1: Vercel (рекомендуется)

Создайте `vercel.json` в корне `apps/web`:

```json
{
  "rewrites": [
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "novavpn.com"
        }
      ],
      "destination": "/nova-vpn"
    },
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "flashvpn.io"
        }
      ],
      "destination": "/flash-vpn"
    }
  ]
}
```

### Вариант 2: Next.js Middleware

```ts
// middleware.ts в apps/web/
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  
  if (hostname === "novavpn.com" || hostname === "www.novavpn.com") {
    return NextResponse.rewrite(new URL("/nova-vpn", request.url));
  }
  
  if (hostname === "flashvpn.io" || hostname === "www.flashvpn.io") {
    return NextResponse.rewrite(new URL("/flash-vpn", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
```

### Вариант 3: Отдельные сборки

```json
// package.json
{
  "scripts": {
    "build:nova": "cross-env BRAND=nova next build",
    "build:flash": "cross-env BRAND=flash next build",
    "build:pixel": "cross-env BRAND=pixel next build"
  }
}
```

## 📱 URL структура

| Домен | Отображается | Auth | Dashboard |
|-------|-------------|------|-----------|
| `novavpn.com` | Nova VPN лендинг | `/login` | `/dashboard` |
| `flashvpn.io` | Flash VPN лендинг | `/login` | `/dashboard` |
| `pixelvpn.app` | Pixel VPN лендинг | `/login` | `/dashboard` |

## ➕ Как добавить третий лендинг

### Шаг 1: Создать структуру

```bash
mkdir -p "apps/web/app/(landing)/super-vpn/components"
```

### Шаг 2: Скопировать шаблон

```tsx
// apps/web/app/(landing)/super-vpn/page.tsx
import type { Metadata } from "next";
import "../../globals.css";
import { SuperHeader } from "./components/SuperHeader";
import { SuperHero } from "./components/SuperHero";
// ... другие компоненты

export const metadata: Metadata = {
  title: "Super VPN — ваш слоган",
  description: "Описание для SEO",
};

export default function SuperVpnPage() {
  return (
    <div className="min-h-screen bg-[ваш_фон]">
      <SuperHeader />
      <main>
        <SuperHero />
        {/* ваши секции */}
      </main>
      <SuperFooter />
    </div>
  );
}
```

### Шаг 3: Создать компоненты

Создайте компоненты с **уникальным стилем**:
- Header с вашим логотипом
- Hero с уникальной структурой
- Pricing с вашими тарифами
- Footer с вашими ссылками

### Шаг 4: Настроить домен

Добавьте в `middleware.ts` или `vercel.json`:

```ts
if (hostname === "supervpn.com") {
  return NextResponse.rewrite(new URL("/super-vpn", request.url));
}
```

## 🎨 Рекомендации по стилю

Чтобы лендинги выглядели по-настоящему разными:

### 1. Разные шрифты
```tsx
// Nova VPN - современный
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

// Flash VPN - технологичный  
import { Space_Grotesk } from "next/font/google";
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

// Super VPN - элегантный
import { Playfair_Display } from "next/font/google";
const playfair = Playfair_Display({ subsets: ["latin"] });
```

### 2. Разные цветовые схемы
```css
/* Nova VPN - Blue */
--primary: #3b82f6;
--secondary: #6366f1;

/* Flash VPN - Neon */
--primary: #a855f7;
--secondary: #06b6d4;

/* Super VPN - Premium */
--primary: #f59e0b;
--secondary: #dc2626;
```

### 3. Разные структуры
- **Nova**: Полный лендинг (Hero → Stats → Features → HowItWorks → Pricing → Testimonials → FAQ → CTA)
- **Flash**: Минималистичный (Hero → Marquee → Features → Servers → Pricing → Download)
- **Super**: Может быть еще короче (Hero → Features → Pricing → Footer)

## 🔗 Переиспользуемые компоненты

Все лендинги могут использовать:
```tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Toaster } from "@/components/ui/Toaster";
```

И общие либы:
```tsx
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
```

## 📊 Аналитика для каждого лендинга

Добавьте разные tracking codes:

```tsx
// Nova VPN - Google Analytics 1
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NOVA123"></script>

// Flash VPN - Google Analytics 2  
<script async src="https://www.googletagmanager.com/gtag/js?id=G-FLASH456"></script>
```

## ✅ Чеклист нового лендинга

- [ ] Уникальное название бренда
- [ ] Уникальный логотип
- [ ] Уникальные цвета
- [ ] Уникальный шрифт (опционально)
- [ ] Уникальная структура секций
- [ ] Уникальные тексты
- [ ] Свои метаданные (SEO)
- [ ] Настроенный домен
- [ ] Аналитика
- [ ] Проверка ссылок (/login, /register)

## 🚀 Быстрый старт

1. **Локальный запуск:**
```bash
cd apps/web
npm run dev

# Открыть http://localhost:3000/nova-vpn
# Открыть http://localhost:3000/flash-vpn
```

2. **Сборка:**
```bash
npm run build
```

3. **Деплой:**
```bash
vercel --prod
```

## 📞 Поддержка

Если нужно создать еще один лендинг - просто скопируйте структуру `nova-vpn/` или `flash-vpn/` и измените стили и контент!
