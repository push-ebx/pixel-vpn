"use client";

import Link from "next/link";
import { Shield, Zap, Lock, Globe, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12">
      <div className="absolute inset-0 technical-grid opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(86,116,214,0.06)_0%,rgba(10,10,10,0)_36%)]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 w-full">
          <div className="pixel-card p-5 md:p-6">
            <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-1 mb-4">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span className="text-[15px] font-pixel-title tracking-[0.08em] text-accent">ЗАЩИЩЕННЫЙ КАНАЛ АКТИВЕН</span>
            </div>

            <h1 className="font-pixel-title text-2xl md:text-4xl tracking-[0.08em] leading-tight mb-4 text-text-primary">
              PIXEL VPN
              <br />
              <span className="text-accent">БЫСТРО БЕЗОПАСНО СТАБИЛЬНО</span>
            </h1>

            <div className="terminal-text text-[13.2px] space-y-1 mb-6">
              <p>
                <span className="prompt">$</span> <span className="command">статус канала</span> <span className="success">активно</span>
              </p>
              <p>
                <span className="prompt">$</span> <span className="command">шифрование</span> aes-256
              </p>
              <p>
                <span className="prompt">$</span> <span className="command">регион</span> авто
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/pricing">
                <Button size="lg" className="font-pixel-title text-[13px] tracking-[0.08em] uppercase">
                  подключить vpn
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="secondary" size="lg" className="font-pixel-title text-[13px] tracking-[0.08em] uppercase">
                  смотреть тарифы
                </Button>
              </Link>
            </div>
          </div>

          <div className="pixel-card p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-accent" />
              <span className="font-pixel-title text-[10px] tracking-[0.08em] text-text-secondary">СЕТЕВОЙ СТАТУС</span>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 border border-accent/40 bg-accent/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-pixel-title text-[16px] md:text-[18px] tracking-[0.06em] text-text-primary">СКОРОСТЬ</p>
                  <p className="text-xs text-text-secondary">Низкая задержка и стабильная полоса для повседневной работы</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 border border-accent/40 bg-accent/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-pixel-title text-[16px] md:text-[18px] tracking-[0.06em] text-text-primary">ЗАЩИТА</p>
                  <p className="text-xs text-text-secondary">Трафик шифруется и маршрутизируется через безопасный канал</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 border border-accent/40 bg-accent/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-pixel-title text-[16px] md:text-[18px] tracking-[0.06em] text-text-primary">ДОСТУП</p>
                  <p className="text-xs text-text-secondary">Подключение к нужным сервисам и стабильный обход ограничений</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border text-[11px] terminal-text">
              <span className="text-text-secondary">состояние:</span> <span className="success">готово к подключению</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
