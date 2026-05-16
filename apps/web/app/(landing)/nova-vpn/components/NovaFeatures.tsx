"use client";

import { motion } from "framer-motion";
import { 
  Zap, 
  Shield, 
  Globe, 
  Lock, 
  Smartphone, 
  Clock 
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Молниеносная скорость",
    description: "Оптимизированные серверы обеспечивают минимальную задержку и максимальную скорость загрузки.",
    color: "from-yellow-400 to-orange-500",
  },
  {
    icon: Shield,
    title: "Военное шифрование",
    description: "Ваши данные защищены по стандарту AES-256 — тому же, что используется в банках и военных системах.",
    color: "from-green-400 to-emerald-500",
  },
  {
    icon: Globe,
    title: "Доступ ко всему миру",
    description: "Обходите географические ограничения и получайте доступ к контенту из любой точки планеты.",
    color: "from-blue-400 to-cyan-500",
  },
  {
    icon: Lock,
    title: "Полная анонимность",
    description: "Мы не ведем логов вашей активности. Ваши действия в сети остаются только вашими.",
    color: "from-purple-400 to-pink-500",
  },
  {
    icon: Smartphone,
    title: "Все устройства",
    description: "Подключайте до 5 устройств одновременно: Windows, macOS, iOS, Android и даже роутеры.",
    color: "from-indigo-400 to-violet-500",
  },
  {
    icon: Clock,
    title: "Поддержка 24/7",
    description: "Наша команда всегда на связи, чтобы помочь вам с настройкой или решением любых вопросов.",
    color: "from-red-400 to-rose-500",
  },
];

export function NovaFeatures() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Почему выбирают нас
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Все, что нужно для безопасного интернета
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Nova VPN объединяет передовые технологии и простоту использования
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
