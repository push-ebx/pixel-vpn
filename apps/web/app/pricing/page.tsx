"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth";
import * as api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceRub: number;
  durationDays: number;
}

interface PaymentIntent {
  id: string;
  status: string;
  yookassa?: {
    checkoutUrl: string | null;
  };
}

export default function PricingPage() {
  const { user, isInitialized, checkAuth } = useAuthStore();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const { data } = await api.getPlans();
      if (data?.plans) {
        setPlans(data.plans);
      }
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setPurchasing(planId);
    const { data } = await api.createPaymentIntent(planId);
    
    if (data?.paymentIntent?.yookassa?.checkoutUrl) {
      window.location.href = data.paymentIntent.yookassa.checkoutUrl;
    } else if (data?.paymentIntent) {
      const { data: updated } = await api.getPaymentIntent(data.paymentIntent.id);
      if (updated?.paymentIntent?.yookassa?.checkoutUrl) {
        window.location.href = updated.paymentIntent.yookassa.checkoutUrl;
      }
    }
    setPurchasing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Выберите свой тариф
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Простые и прозрачные цены без скрытых платежей. 
            Выберите подходящий план и начните пользоваться VPN прямо сейчас.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-text-secondary">Загрузка тарифов...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.filter(p => p.code !== "trial-3d").map((plan) => (
              <Card key={plan.id} className={`flex flex-col ${plan.code === "MONTHLY" ? "border-accent" : ""}`}>
                {plan.code === "MONTHLY" && (
                  <div className="bg-accent text-white text-center text-sm py-1 -mt-6 -mx-6 mb-4 rounded-t-lg">
                    Популярный
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-text-secondary mt-1">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-text-primary">
                      {plan.priceRub}
                    </span>
                    <span className="text-text-secondary ml-1">₽</span>
                  </div>
                  <div className="text-sm text-text-secondary mb-6">
                    {plan.durationDays} дней
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>Безлимитный трафик</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>До 5 устройств</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>Поддержка 24/7</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchasing === plan.id}
                  >
                    {purchasing === plan.id ? "Загрузка..." : (user ? "Приобрести" : "Войти для покупки")}
                  </button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-text-secondary text-sm">
            Все цены указаны в рублях. Оплата через YooKassa.
          </p>
        </div>
      </main>
    </div>
  );
}
