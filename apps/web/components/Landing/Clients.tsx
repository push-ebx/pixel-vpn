"use client";

import { Monitor, Smartphone, Tablet, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Клиенты для всех платформ
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Скачайте приложение для любого устройства и защитите свой интернет.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {clients.map((client, index) => (
            <Card key={index} hover={client.status === "available"}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <client.icon className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-text-primary">{client.title}</h3>
                    {client.status === "coming-soon" && (
                      <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">
                        Скоро
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm mt-1">{client.description}</p>
                  {client.status === "available" && (
                    <Link href="/dashboard" className="inline-block mt-3">
                      <Button size="sm" variant="ghost" className="text-accent p-0 h-auto hover:text-accent-hover">
                        Скачать →
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
