"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Александр М.",
    role: "Разработчик",
    content: "Использую Nova VPN для работы с зарубежными сервисами. Скорость отличная, подключение стабильное. Рекомендую!",
    rating: 5,
  },
  {
    name: "Екатерина В.",
    role: "Дизайнер",
    content: "Пробовала много VPN-сервисов, но Nova оказался самым удобным. Приложение красивое и понятное, даже для не-технаря.",
    rating: 5,
  },
  {
    name: "Дмитрий К.",
    role: "Предприниматель",
    content: "Подключаю всю семью. Семейный тариф очень выгодный, а скорость не падает даже когда все устройства онлайн.",
    rating: 5,
  },
];

export function NovaTestimonials() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Отзывы
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Что говорят наши пользователи
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div>
                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
