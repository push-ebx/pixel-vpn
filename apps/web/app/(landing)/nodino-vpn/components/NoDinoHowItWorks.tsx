"use client";

import { motion } from "framer-motion";
import { Download, MousePointer, Rocket, Check } from "lucide-react";

const steps = [
  {
    icon: Download,
    step: 1,
    title: "Скачайте приложение",
    description: "Установите NoDino VPN на любое устройство за 1 минуту.",
  },
  {
    icon: MousePointer,
    step: 2,
    title: "Нажмите одну кнопку",
    description: "Автоматическое подключение к лучшему серверу.",
  },
  {
    icon: Rocket,
    step: 3,
    title: "Забудьте о проблемах",
    description: "Наслаждайтесь стабильным интернетом без ограничений.",
  },
];

export function NoDinoHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium text-green-500 uppercase tracking-wide mb-3">
              Как это работает
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Проще, чем запустить динозаврика
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Три простых шага — и вы забываете о проблемах с интернетом
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center"
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-green-500/20 rounded-full" />
                <div className="relative w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border-2 border-green-500">
                  <span className="text-xs font-bold text-green-500">{step.step}</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-slate-400">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl border border-green-500/30 max-w-3xl mx-auto"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Гарантия "Никаких динозавриков"
              </h3>
              <p className="text-slate-300">
                Если вы хоть раз увидите страницу "Нет подключения к интернету" 
                по нашей вине — вернем деньги за весь месяц. Без вопросов.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
