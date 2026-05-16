"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Сохраняете ли вы логи моей активности?",
    answer: "Нет, мы не ведем логов вашей онлайн-активности. Наша политика строгого no-logs означает, что мы не отслеживаем, не записываем и не храним информацию о ваших действиях в интернете."
  },
  {
    question: "Можно ли использовать на нескольких устройствах?",
    answer: "Да! В зависимости от тарифа вы можете подключить от 1 до 10 устройств одновременно. Поддерживаются Windows, macOS, iOS, Android и даже роутеры."
  },
  {
    question: "Будет ли падать скорость интернета?",
    answer: "Мы используем оптимизированные серверы с высокой пропускной способностью. В большинстве случаев падение скорости минимально и незаметно при обычном использовании."
  },
  {
    question: "Какие способы оплаты вы принимаете?",
    answer: "Мы принимаем банковские карты, электронные кошельки и криптовалюту. Все платежи безопасны и защищены."
  },
  {
    question: "Есть ли пробный период?",
    answer: "Да, у нас есть 7-дневная гарантия возврата средств. Если сервис вам не подойдет, мы вернем деньги без вопросов."
  },
];

export function NovaFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Часто задаваемые вопросы
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4 text-slate-600">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
