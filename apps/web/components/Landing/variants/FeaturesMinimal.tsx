"use client";

import { Shield, Zap, Globe, Lock, Gauge, GitBranch } from "lucide-react";

const features = [
  { icon: Zap, title: "Скорость", description: "Высокая скорость соединения" },
  { icon: Shield, title: "Защита", description: "Надежное шифрование" },
  { icon: Globe, title: "Доступ", description: "Работает везде" },
  { icon: Lock, title: "Приватность", description: "Никаких логов" },
  { icon: Gauge, title: "Без лимитов", description: "Неограниченный трафик" },
  { icon: GitBranch, title: "Умное подключение", description: "Только нужные сайты" },
];

// Minimal тема - чистый список
export function FeaturesMinimal() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-light text-neutral-900 mb-12">Возможности</h2>
          
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-6 py-6 border-b border-neutral-200 last:border-0"
              >
                <feature.icon className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div>
                  <h3 className="text-base font-medium text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-neutral-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
