"use client";

import { motion } from "framer-motion";
import { Download, UserPlus, Power, Rocket } from "lucide-react";

const steps = [
  {
    icon: Download,
    step: "01",
    title: "Скачайте приложение",
    description: "Установите Nova VPN на ваше устройство из App Store, Google Play или с нашего сайта.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Создайте аккаунт",
    description: "Зарегистрируйтесь за 30 секунд. Достаточно email — никаких лишних данных.",
  },
  {
    icon: Power,
    step: "03",
    title: "Нажмите кнопку",
    description: "Выберите сервер и нажмите одну кнопку для подключения. Всё работает автоматически.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Наслаждайтесь",
    description: "Получите доступ к свободному интернету с защитой ваших данных.",
  },
];

export function NovaHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Как это работает
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Начните использовать за 3 минуты
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Проще, чем заварить чашку кофе
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent" />
              )}
              
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full" />
                  <div className="relative w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
