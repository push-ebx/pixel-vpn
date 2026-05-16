"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, WifiOff } from "lucide-react";
import { LandingPurchaseButton } from "@/components/Landing/LandingPurchaseButton";
import { filterPlansForLanding, type Plan } from "@/lib/plans";

const plans = [
  {
    code: "nodino-basic-30d",
    name: "Базовый",
    description: "Для личного использования",
    price: "149",
    period: "мес",
    features: [
      "1 устройство",
      "Базовая скорость",
      "10 серверов",
      "Поддержка по email",
    ],
    cta: "Выбрать",
    popular: false,
  },
  {
    code: "nodino-pro-30d",
    name: "Про",
    description: "Для активных пользователей",
    price: "249",
    period: "мес",
    features: [
      "5 устройств",
      "Максимальная скорость",
      "Все серверы",
      "Круглосуточная поддержка",
      "Безлимитный трафик",
    ],
    cta: "Популярный",
    popular: true,
  },
  {
    code: "nodino-max-30d",
    name: "Максимум",
    description: "Для семьи и бизнеса",
    price: "399",
    period: "мес",
    features: [
      "Неограниченно устройств",
      "10Gbps канал",
      "Все серверы",
      "Приоритетная поддержка",
      "Выделенный IP",
    ],
    cta: "Выбрать",
    popular: false,
  },
];

type NoDinoPricingProps = {
  plans?: Plan[];
};

function durationLabel(days: number) {
  if (days >= 365) return "год";
  if (days >= 180) return "6 мес";
  if (days >= 90) return "3 мес";
  if (days >= 30) return "мес";
  return `${days} дн`;
}

export function NoDinoPricing({ plans: backendPlans = [] }: NoDinoPricingProps) {
  const landingPlans = filterPlansForLanding(backendPlans, "nodino-vpn");
  const displayedPlans = landingPlans.length > 0
    ? landingPlans.map((plan, index) => ({
        ...plans[index % plans.length],
        code: plan.code,
        name: plan.name,
        description: plan.description || plans[index % plans.length].description,
        price: String(plan.priceRub),
        period: durationLabel(plan.durationDays),
      }))
    : plans;

  return (
    <section id="pricing" className="py-24 bg-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium text-green-500 uppercase tracking-wide mb-3">
              Тарифы
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Выберите свой план
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Все тарифы включают гарантию "Никаких динозавриков"
              и 7-дневный пробный период
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {displayedPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                plan.popular
                  ? "bg-gradient-to-b from-green-600 to-green-700 border-2 border-green-500"
                  : "bg-slate-700 border border-slate-600"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-sm font-bold rounded-full flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  Нет динозавриков
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-1 ${plan.popular ? "text-white" : "text-white"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? "text-green-100" : "text-slate-400"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-white"}`}>
                  {plan.price}
                </span>
                <span className={`text-lg ${plan.popular ? "text-green-100" : "text-slate-400"}`}>
                  {" "}₽/{plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className={`w-5 h-5 ${plan.popular ? "text-green-200" : "text-green-500"}`} />
                    <span className={plan.popular ? "text-green-50" : "text-slate-300"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <LandingPurchaseButton
                planCode={plan.code}
                landingSlug="nodino-vpn"
                className={`w-full ${
                    plan.popular
                      ? "bg-white text-green-600 hover:bg-green-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {plan.cta}
              </LandingPurchaseButton>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
