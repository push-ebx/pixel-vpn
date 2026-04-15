"use client";

import Link from "next/link";
import { Shield, Zap, Globe, Lock, Server, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm text-accent font-medium">Безопасность превыше всего</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
          <span className="text-text-primary">VPN без</span>
          <br />
          <span className="text-gradient">границ</span>
        </h1>

        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Быстрый и надёжный VPN сервис для свободного интернета.
          Защитите свои данные и обходите блокировки.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link href="/pricing">
            <Button size="lg" className="glow">
              Подключить VPN
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary" size="lg">
              Тарифы
            </Button>
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-text-secondary animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span>Быстрый</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <span>Безопасный</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" />
            <span>Глобальный</span>
          </div>
        </div>
      </div>
    </section>
  );
}
