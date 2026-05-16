"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { LandingPurchaseButton } from "@/components/Landing/LandingPurchaseButton";
import { filterPlansForLanding, type Plan } from "@/lib/plans";

const plans = [
  {
    code: "nova-basic-30d",
    name: "Базовый",
    description: "Для личного использования",
    price: "199",
    period: "мес",
    features: [
      "1 устройство",
      "Базовые серверы",
      "Стандартная скорость",
      "Email поддержка",
    ],
    cta: "Выбрать тариф",
    popular: false,
  },
  {
    code: "nova-premium-30d",
    name: "Премиум",
    description: "Для активных пользователей",
    price: "299",
    period: "мес",
    features: [
      "До 5 устройств",
      "Все серверы",
      "Максимальная скорость",
      "Приоритетная поддержка",
      "Раздельное туннелирование",
    ],
    cta: "Популярный выбор",
    popular: true,
  },
  {
    code: "nova-family-30d",
    name: "Семейный",
    description: "Для всей семьи",
    price: "499",
    period: "мес",
    features: [
      "До 10 устройств",
      "Все серверы",
      "Максимальная скорость",
      "Круглосуточная поддержка",
      "Раздельное туннелирование",
      "Выделенный IP",
    ],
    cta: "Выбрать тариф",
    popular: false,
  },
];

type NovaPricingProps = {
  plans?: Plan[];
};

function durationLabel(days: number) {
  if (days >= 365) return "год";
  if (days >= 180) return "6 мес";
  if (days >= 90) return "3 мес";
  if (days >= 30) return "мес";
  return `${days} дн`;
}

export function NovaPricing({ plans: backendPlans = [] }: NovaPricingProps) {
  const landingPlans = filterPlansForLanding(backendPlans, "nova-vpn");
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
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Тарифы
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Выберите подходящий план
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Все тарифы включают 7-дневную гарантию возврата средств
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {displayedPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 scale-105"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                  Популярный
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-semibold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.popular ? "text-blue-100" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.price}
                </span>
                <span className={`text-lg ${plan.popular ? "text-blue-200" : "text-slate-500"}`}>
                  {" "}₽/{plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-white/20" : "bg-blue-100"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-white" : "text-blue-600"}`} />
                    </div>
                    <span className={plan.popular ? "text-blue-50" : "text-slate-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <LandingPurchaseButton
                planCode={plan.code}
                landingSlug="nova-vpn"
                className={`w-full ${
                    plan.popular
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {plan.cta}
              </LandingPurchaseButton>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8">
          Есть вопросы? <a href="#faq" className="text-blue-600 hover:underline">Смотрите FAQ</a> или <a href="#" className="text-blue-600 hover:underline">напишите нам</a>
        </p>
      </div>
    </section>
  );
}
