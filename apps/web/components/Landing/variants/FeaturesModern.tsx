"use client";

import { Shield, Zap, Globe, Lock, Gauge, GitBranch } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Стабильный канал",
    description: "Оптимизированные узлы снижают задержку и дают предсказуемую скорость",
  },
  {
    icon: Shield,
    title: "Шифрование трафика",
    description: "Защищенный туннель снижает риск перехвата в публичных сетях",
  },
  {
    icon: Globe,
    title: "Геодоступ",
    description: "Подключение через Нидерланды",
  },
  {
    icon: Lock,
    title: "Приватность",
    description: "Минимизация данных о действиях пользователя",
  },
  {
    icon: Gauge,
    title: "Без лимитов",
    description: "Без ограничений по объему данных",
  },
  {
    icon: GitBranch,
    title: "Раздельное туннелирование",
    description: "Только заблокированные сайты через VPN",
  },
];

// Modern тема - карточки с иконками
export function FeaturesModern() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Возможности</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Почему выбирают нас</h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Все необходимое для комфортной и безопасной работы в интернете
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
