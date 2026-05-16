"use client";

import Link from "next/link";
import { Shield, Zap, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Gradient тема - темная с градиентами
export function HeroGradient() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      {/* Градиентный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      
      {/* Анимированные градиенты */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/70">Сервис онлайн</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              VPN нового
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                поколения
              </span>
            </h1>

            <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-lg">
              Современные протоколы шифрования, мгновенное подключение 
              и полная свобода в интернете.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#pricing">
                <Button 
                  size="lg" 
                  className="px-8 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 rounded-xl"
                >
                  Начать использовать
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="px-8 text-base text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  Тарифы
                </Button>
              </Link>
            </div>
          </div>

          {/* Карточки с фичами */}
          <div className="space-y-4">
            {[
              { 
                icon: Zap, 
                title: "Максимальная скорость", 
                desc: "Оптимизированные серверы для минимальной задержки",
                gradient: "from-yellow-400 to-orange-500"
              },
              { 
                icon: Shield, 
                title: "Военное шифрование", 
                desc: "Стандарт AES-256 для защиты ваших данных",
                gradient: "from-green-400 to-emerald-500"
              },
              { 
                icon: Lock, 
                title: "Полная приватность", 
                desc: "Никаких логов, никаких следов",
                gradient: "from-purple-400 to-pink-500"
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-white/50">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
