"use client";

import { motion } from "framer-motion";
import { Wifi, Shield, Zap, Globe, Clock, Headphones } from "lucide-react";

const features = [
  {
    icon: Wifi,
    title: "Стабильное соединение",
    description: "99.9% времени безотказной работы. Наши серверы никогда не спят.",
    color: "bg-green-500",
  },
  {
    icon: Shield,
    title: "Защита от блокировок",
    description: "Обходите любые ограничения и цензуру. Интернет без границ.",
    color: "bg-blue-500",
  },
  {
    icon: Zap,
    title: "Высокая скорость",
    description: "Оптимизированные серверы для максимальной скорости загрузки.",
    color: "bg-yellow-500",
  },
  {
    icon: Globe,
    title: "Серверы по всему миру",
    description: "Доступ к контенту из любой точки планеты через наши серверы.",
    color: "bg-purple-500",
  },
  {
    icon: Clock,
    title: "Поддержка 24/7",
    description: "Наша команда всегда на связи, чтобы помочь с любыми вопросами.",
    color: "bg-orange-500",
  },
  {
    icon: Headphones,
    title: "Простая настройка",
    description: "Подключение за 2 минуты. Никаких сложных инструкций.",
    color: "bg-pink-500",
  },
];

export function NoDinoFeatures() {
  return (
    <section id="features" className="py-24 bg-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium text-green-500 uppercase tracking-wide mb-3">
              Почему NoDino VPN
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Интернет, который всегда работает
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Мы создали VPN, который никогда не подводит. 
              Никаких страниц с ошибками, никаких динозавриков.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-green-500/50 transition-colors group"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
