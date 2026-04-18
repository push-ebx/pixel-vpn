"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth";
import * as api from "@/lib/api";
import { useRouter } from "next/navigation";

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceRub: number;
  durationDays: number;
}

type PricingClientProps = {
  initialPlans: Plan[];
};

export default function PricingClient({ initialPlans }: PricingClientProps) {
  const { user, isInitialized, checkAuth } = useAuthStore();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const isMockPaymentEnabled = process.env.NEXT_PUBLIC_MOCK_PAYMENT === "true";

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setPaymentError(null);
    setPurchasing(planId);
    try {
      const { data, error } = await api.createPaymentIntent(planId);
      if (error) {
        setPaymentError(error);
        return;
      }

      const paymentIntent = data?.paymentIntent;
      if (!paymentIntent) {
        setPaymentError("Не удалось создать платеж, попробуйте снова");
        return;
      }

      if (isMockPaymentEnabled) {
        const mockResult = await api.mockPaymentSuccess(paymentIntent.id);
        if (mockResult.error) {
          setPaymentError(mockResult.error);
          return;
        }
        router.push("/dashboard");
        return;
      }

      if (paymentIntent.status === "paid") {
        router.push("/dashboard");
        return;
      }

      if (paymentIntent.yookassa?.checkoutUrl) {
        window.location.href = paymentIntent.yookassa.checkoutUrl;
        return;
      }

      const { data: updated, error: updatedError } = await api.getPaymentIntent(paymentIntent.id);
      if (updatedError) {
        setPaymentError(updatedError);
        return;
      }

      if (updated?.paymentIntent?.status === "paid") {
        router.push("/dashboard");
        return;
      }

      if (updated?.paymentIntent?.yookassa?.checkoutUrl) {
        window.location.href = updated.paymentIntent.yookassa.checkoutUrl;
        return;
      }

      setPaymentError("Платеж не готов, попробуйте снова через несколько секунд");
    } catch {
      setPaymentError("Не удалось начать оплату, проверьте соединение и повторите попытку");
    } finally {
      setPurchasing(null);
    }
  };

  const plans = initialPlans.filter((p) => p.code !== "trial-3d");
  const gridClass =
    plans.length <= 1
      ? "grid-cols-1"
      : plans.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

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
          <h1 className="text-4xl font-bold text-text-primary mb-4">Выберите свой тариф</h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Простые и прозрачные цены без скрытых платежей.
            Выберите подходящий план и начните пользоваться VPN прямо сейчас.
          </p>
        </div>

        {plans.length > 0 ? (
          <>
            <div className={`grid ${gridClass} gap-6 w-full`}>
              {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col ${plan.code === "MONTHLY" ? "border-accent" : ""}`}>
                  {plan.code === "MONTHLY" && (
                    <div className="bg-accent text-white text-center text-sm py-1 -mt-6 -mx-6 mb-4 rounded-t-lg">
                      Популярный
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.description && <p className="text-sm text-text-secondary mt-1">{plan.description}</p>}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-text-primary">{plan.priceRub}</span>
                      <span className="text-text-secondary ml-1">₽</span>
                    </div>
                    <div className="text-sm text-text-secondary mb-6">{plan.durationDays} дней</div>

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
                      {purchasing === plan.id ? "Загрузка..." : user ? "Приобрести" : "Войти для покупки"}
                    </button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {paymentError && (
              <p className="mt-4 text-center text-sm text-error">{paymentError}</p>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-text-secondary">Тарифы временно недоступны</div>
        )}

        <div className="mt-12 text-center">
          <p className="text-text-secondary text-sm">Все цены указаны в рублях. Оплата через YooKassa.</p>
        </div>
      </main>
    </div>
  );
}
