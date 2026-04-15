"use client";

import { Shield, Zap, Globe, Lock, Gauge, Headphones } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const features = [
  {
    icon: Zap,
    title: "Молниеносная скорость",
    description: "Оптимизированные серверы по всему миру обеспечивают минимальную задержку и максимальную скорость.",
  },
  {
    icon: Shield,
    title: "Военная защита",
    description: "Шифрование трафика по стандарту AES-256 гарантирует полную безопасность ваших данных.",
  },
  {
    icon: Globe,
    title: "Глобальная сеть",
    description: "Серверы в 50+ локациях по всему миру. Обходите географические ограничения без усилий.",
  },
  {
    icon: Lock,
    title: "Политика No-Logs",
    description: "Мы не храним логи активности. Ваша приватность — наш главный приоритет.",
  },
  {
    icon: Gauge,
    title: "Без лимитов",
    description: "Неограниченная пропускная способность. Смотрите, качайте, играйте без ограничений.",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    description: "Наша команда поддержки всегда готова помочь вам в любое время суток.",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Почему выбирают Pixel VPN?
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Мы создали VPN, который сочетает в себе скорость, безопасность и простоту использования.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} hover>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <CardHeader className="mb-0 p-0">
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <p className="text-text-secondary mt-2">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
