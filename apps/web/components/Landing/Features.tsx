"use client";

import { Shield, Zap, Globe, Lock, Gauge, Headphones } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

const features = [
  {
    code: "01",
    icon: Zap,
    title: "Стабильный канал",
    description: "Оптимизированные узлы снижают задержку и дают предсказуемую скорость в течение сессии",
  },
  {
    code: "02",
    icon: Shield,
    title: "Шифрование трафика",
    description: "Данные проходят через защищенный туннель, что снижает риск перехвата в публичных сетях",
  },
  {
    code: "03",
    icon: Globe,
    title: "Геодоступ",
    description: "Подключение только через Нидерланды",
  },
  {
    code: "04",
    icon: Lock,
    title: "Приватный режим",
    description: "Конфигурация построена на минимизации данных о действиях пользователя в приложении",
  },
  {
    code: "05",
    icon: Gauge,
    title: "Без лимита трафика",
    description: "Подходит для видео, работы и звонков без искусственных ограничений по объему данных",
  },
  {
    code: "06",
    icon: Headphones,
    title: "Туннелирование трафика",
    description: "Через VPN-туннель проходят только запросы к заблокированным сайтам",
  },
];

export function Features() {
  return (
    <section className="py-12 bg-background border-t border-border/60">
      <div className="container mx-auto px-4">
        <div className="mb-7">
          <p className="font-pixel-title text-[13px] tracking-[0.08em] text-text-secondary mb-2">ВОЗМОЖНОСТИ</p>
          <h2 className="font-pixel-title text-xl md:text-2xl tracking-[0.08em] text-text-primary">Что есть в Pixel VPN</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} hover className="pixel-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 border border-accent/40 bg-accent/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[10px] font-pixel-title tracking-[0.08em] text-text-secondary">[{feature.code}]</span>
              </div>
              <CardHeader className="mb-0 p-0">
                <CardTitle className="font-pixel-title text-sm tracking-[0.06em]">{feature.title}</CardTitle>
              </CardHeader>
              <p className="text-text-secondary mt-2 text-xs leading-relaxed terminal-text">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
