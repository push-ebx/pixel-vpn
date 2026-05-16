"use client";

import { Shield, Zap, Globe, Lock, Gauge, GitBranch } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Максимальная скорость",
    description: "Оптимизированные серверы для минимальной задержки",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Shield,
    title: "Военное шифрование",
    description: "Стандарт AES-256 для защиты ваших данных",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: Globe,
    title: "Глобальный доступ",
    description: "Подключение через Нидерланды к любым ресурсам",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: Lock,
    title: "Полная приватность",
    description: "Никаких логов, никаких следов",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Gauge,
    title: "Без ограничений",
    description: "Неограниченный трафик для любых задач",
    gradient: "from-red-400 to-rose-500",
  },
  {
    icon: GitBranch,
    title: "Умная маршрутизация",
    description: "Раздельное туннелирование трафика",
    gradient: "from-indigo-400 to-violet-500",
  },
];

// Gradient тема - градиентные карточки
export function FeaturesGradient() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-widest mb-4">Возможности</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Что вы получаете</h2>
          <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto">
            Современные технологии для свободы и безопасности в интернете
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
