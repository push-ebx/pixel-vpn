"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "50+", label: "тысяч пользователей" },
  { value: "99.9%", label: "время безотказной работы" },
  { value: "10", label: "серверов по всему миру" },
  { value: "24/7", label: "техническая поддержка" },
];

export function NovaStats() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
