"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Globe, Lock, Gauge, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "WireGuard Protocol",
    description: "Самый быстрый VPN протокол. Минимальная нагрузка на процессор.",
    color: "text-yellow-400",
    borderColor: "border-yellow-400/30",
  },
  {
    icon: Shield,
    title: "Kill Switch",
    description: "Мгновенное отключение интернета при разрыве VPN соединения.",
    color: "text-red-400",
    borderColor: "border-red-400/30",
  },
  {
    icon: Globe,
    title: "Smart Routing",
    description: "Автоматический выбор лучшего сервера для максимальной скорости.",
    color: "text-cyan-400",
    borderColor: "border-cyan-400/30",
  },
  {
    icon: Lock,
    title: "No Logs",
    description: "Мы не записываем вашу активность. Никаких следов.",
    color: "text-green-400",
    borderColor: "border-green-400/30",
  },
  {
    icon: Gauge,
    title: "10Gbps Servers",
    description: "Серверы с каналом 10 гигабит для максимальной скорости.",
    color: "text-purple-400",
    borderColor: "border-purple-400/30",
  },
  {
    icon: Clock,
    title: "Auto Connect",
    description: "Автоматическое подключение при запуске устройства.",
    color: "text-pink-400",
    borderColor: "border-pink-400/30",
  },
];

export function FlashFeatures() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-widest mb-4">
            Технологии
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Почему мы быстрее
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group p-6 border ${feature.borderColor} bg-white/5 hover:bg-white/10 transition-colors`}
            >
              <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
