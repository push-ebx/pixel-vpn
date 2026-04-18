"use client";

import { Monitor, Smartphone, Tablet, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const clients = [
  {
    icon: Monitor,
    title: "Windows",
    description: "Удобное приложение для Windows 10 и 11",
    status: "available",
  },
  {
    icon: Monitor,
    title: "macOS",
    description: "Нативное приложение для Mac с чипом Apple Silicon",
    status: "available",
  },
  {
    icon: Smartphone,
    title: "iOS",
    description: "Защитите свой iPhone и iPad",
    status: "available",
  },
  {
    icon: Smartphone,
    title: "Android",
    description: "Приложение для Android устройств",
    status: "available",
  },
  {
    icon: Tablet,
    title: "Android TV",
    description: "Смотрите контент на большом экране",
    status: "available",
  },
  {
    icon: Globe,
    title: "Роутеры",
    description: "Настройте VPN на роутере для всех устройств",
    status: "coming-soon",
  },
];

export function Clients() {
  return (
    <section className="py-12 bg-background border-t border-border/60">
      <div className="container mx-auto px-4">
        <div className="mb-7">
          <p className="font-pixel-title text-[13px] tracking-[0.08em] text-text-secondary mb-2">КЛИЕНТЫ</p>
          <h2 className="font-pixel-title text-xl md:text-2xl tracking-[0.08em] text-text-primary mb-2">
            Приложения для платформ
          </h2>
          <p className="text-sm text-text-secondary max-w-3xl">Выберите устройство и установите клиент за пару минут</p>
        </div>

        <div className="pixel-card w-full overflow-hidden">
          {clients.map((client, index) => (
            <div
              key={index}
              className={cn(
                "p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4",
                index !== clients.length - 1 && "border-b border-border"
              )}
            >
              <div className="w-9 h-9 border border-accent/40 bg-accent/10 flex items-center justify-center shrink-0">
                <client.icon className="w-4 h-4 text-accent" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-pixel-title text-[11px] tracking-[0.08em] text-text-primary">{client.title}</p>
                <p className="text-xs text-text-secondary terminal-text mt-1">{client.description}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {client.status === "available" ? (
                  <Link href="/dashboard">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="font-pixel-title text-[12.5px] tracking-[0.08em] text-accent uppercase"
                    >
                      скачать
                    </Button>
                  </Link>
                ) : (
                  <span className="px-2 py-1 border border-border text-[12.5px] text-text-secondary font-pixel-title tracking-[0.06em]">
                    скоро
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
