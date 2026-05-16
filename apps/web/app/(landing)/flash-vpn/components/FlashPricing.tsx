"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { LandingPurchaseButton } from "@/components/Landing/LandingPurchaseButton";
import { filterPlansForLanding, type Plan } from "@/lib/plans";

const plans = [
  {
    code: "flash-starter-30d",
    name: "STARTER",
    price: "149",
    period: "мес",
    features: [
      "1 устройство",
      "Базовые серверы",
      "Стандартная скорость",
    ],
    cta: "Выбрать",
    popular: false,
  },
  {
    code: "flash-30d",
    name: "FLASH",
    price: "249",
    period: "мес",
    features: [
      "5 устройств",
      "Все серверы",
      "Максимальная скорость",
      "Kill Switch",
      "Приоритетная поддержка",
    ],
    cta: "Популярный",
    popular: true,
  },
  {
    code: "flash-ultra-30d",
    name: "ULTRA",
    price: "399",
    period: "мес",
    features: [
      "Безлимит устройств",
      "Все серверы",
      "10Gbps канал",
      "Выделенный IP",
      "White-label",
    ],
    cta: "Выбрать",
    popular: false,
  },
];

type FlashPricingProps = {
  plans?: Plan[];
};

function durationLabel(days: number) {
  if (days >= 365) return "год";
  if (days >= 180) return "6 мес";
  if (days >= 90) return "3 мес";
  if (days >= 30) return "мес";
  return `${days} дн`;
}

export function FlashPricing({ plans: backendPlans = [] }: FlashPricingProps) {
  const landingPlans = filterPlansForLanding(backendPlans, "flash-vpn");
  const displayedPlans = landingPlans.length > 0
    ? landingPlans.map((plan, index) => ({
        ...plans[index % plans.length],
        code: plan.code,
        name: plan.name,
        price: String(plan.priceRub),
        period: durationLabel(plan.durationDays),
      }))
    : plans;

  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-4">
            Тарифы
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Выбери свою скорость
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {displayedPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 border ${
                plan.popular
                  ? "border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-transparent"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-xs font-bold text-white">
                  ПОПУЛЯРНЫЙ
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-400 mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500">₽/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <LandingPurchaseButton
                planCode={plan.code}
                landingSlug="flash-vpn"
                className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-0"
                      : "bg-white/10 hover:bg-white/20 border border-white/20"
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
