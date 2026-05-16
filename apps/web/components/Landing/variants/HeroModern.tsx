"use client";

import Link from "next/link";
import { Shield, Zap, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Modern тема - светлый современный дизайн
export function HeroModern() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Градиентный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/50 to-transparent" />

      {/* Декоративные круги */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-slate-200 mb-8 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-600">Доступно для всех платформ</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
            Быстрый VPN
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              для свободного интернета
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Безопасное и стабильное подключение через Нидерланды.
            Без лимитов трафика и сложных настроек.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/#pricing">
              <Button size="lg" className="px-8 py-4 text-lg rounded-full shadow-lg shadow-blue-500/25">
                Начать
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="secondary" size="lg" className="px-8 py-4 text-lg rounded-full">
                Смотреть тарифы
              </Button>
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Zap, text: "Высокая скорость" },
              { icon: Shield, text: "Защита данных" },
              { icon: Lock, text: "Шифрование AES-256" },
              { icon: Globe, text: "Доступ из любой точки" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-slate-200 shadow-sm"
              >
                <feature.icon className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
