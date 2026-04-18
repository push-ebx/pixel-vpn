"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowLeft, Tag, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth";
import * as api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCheckingReturnedPayment, setIsCheckingReturnedPayment] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [checkingPromo, setCheckingPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validPromos, setValidPromos] = useState<Record<string, {
    id: string;
    discountPercent: number;
    finalPrice: number;
  }>>({});
  const isMockPaymentEnabled = process.env.NEXT_PUBLIC_MOCK_PAYMENT === "true";
  const returnedPaymentIntentId = searchParams.get("payment_intent_id");

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  useEffect(() => {
    if (!returnedPaymentIntentId || !isInitialized || !user) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const pollStatus = async (attempt: number) => {
      if (cancelled) {
        return;
      }

      setIsCheckingReturnedPayment(true);

      const { data, error } = await api.getPaymentIntent(returnedPaymentIntentId);
      if (cancelled) {
        return;
      }

      if (error) {
        setPaymentError(error);
        setIsCheckingReturnedPayment(false);
        return;
      }

      const status = data?.paymentIntent?.status;
      if (status === "paid") {
        router.replace("/dashboard");
        return;
      }

      if (status === "pending" && attempt < 8) {
        timeoutId = setTimeout(() => {
          void pollStatus(attempt + 1);
        }, 2000);
        return;
      }

      if (status === "pending") {
        setPaymentError("Платеж еще обрабатывается. Обновите страницу через несколько секунд.");
      } else if (status === "canceled") {
        setPaymentError("Платеж был отменен.");
      } else if (status === "failed") {
        setPaymentError("Платеж завершился с ошибкой.");
      } else if (status === "expired") {
        setPaymentError("Срок действия счета истек.");
      }

      setIsCheckingReturnedPayment(false);
    };

    void pollStatus(1);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [returnedPaymentIntentId, isInitialized, user, router]);

  const handlePurchase = async (plan: Plan) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setPaymentError(null);
    setPurchasing(plan.id);
    try {
      const { data, error } = await api.createPaymentIntent({ planCode: plan.code });
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

  const handleApplyPromoCode = async (plan: Plan) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const code = promoCodeInput.trim();
    if (!code) {
      setPromoError("Введите промокод");
      return;
    }

    setCheckingPromo(plan.id);
    setPromoError(null);
    setValidPromos((prev) => {
      const copy = { ...prev };
      delete copy[plan.id];
      return copy;
    });

    try {
      const { data, error } = await api.applyPromoCode({
        planCode: plan.code,
        promoCode: code,
      });

      if (error) {
        setPromoError(error);
        setCheckingPromo(null);
        return;
      }

      if (!data) {
        setPromoError("Ошибка применения промокода");
        setCheckingPromo(null);
        return;
      }

      if (data.free) {
        router.push("/dashboard");
        return;
      }

      if (data.applied && data.finalPrice !== undefined) {
        const promo = {
          id: data.promoCode?.id || "",
          discountPercent: data.discountPercent,
          finalPrice: data.finalPrice,
        };
        setValidPromos((prev) => ({
          ...prev,
          [plan.id]: promo,
        }));
      }
    } catch {
      setPromoError("Не удалось применить промокод");
    } finally {
      setCheckingPromo(null);
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
                    {validPromos[plan.id] ? (
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-accent">{validPromos[plan.id].finalPrice}</span>
                          <span className="text-text-secondary">₽</span>
                          <span className="text-sm text-accent">(-{validPromos[plan.id].discountPercent}%)</span>
                        </div>
                        <div className="text-sm text-text-secondary line-through mt-1">{plan.priceRub} ₽</div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-text-primary">{plan.priceRub}</span>
                        <span className="text-text-secondary ml-1">₽</span>
                      </div>
                    )}
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
                  <CardFooter className="space-y-3">
                    {validPromos[plan.id] ? (
                      <button
                        type="button"
                        className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handlePurchase(plan)}
                        disabled={purchasing === plan.id}
                      >
                        {purchasing === plan.id ? "Загрузка..." : user ? "Оплатить со скидкой" : "Войти для покупки"}
                      </button>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            <input
                              type="text"
                              placeholder="Промокод"
                              value={promoCodeInput}
                              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                              className="w-full pl-9 pr-3 py-2 rounded-md bg-card border border-border text-text-primary placeholder:text-text-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                              disabled={checkingPromo === plan.id}
                            />
                          </div>
                          <button
                            type="button"
                            className="px-3 py-2 bg-secondary hover:bg-secondary-hover text-text-primary font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            onClick={() => handleApplyPromoCode(plan)}
                            disabled={checkingPromo === plan.id || !promoCodeInput.trim()}
                          >
                            {checkingPromo === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Применить"}
                          </button>
                        </div>
                        {promoError && plan.id === plans[0]?.id && (
                          <p className="text-sm text-error text-center">{promoError}</p>
                        )}
                        <button
                          type="button"
                          className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handlePurchase(plan)}
                          disabled={purchasing === plan.id}
                        >
                          {purchasing === plan.id ? "Загрузка..." : user ? "Приобрести" : "Войти для покупки"}
                        </button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            {isCheckingReturnedPayment && (
              <p className="mt-4 text-center text-sm text-text-secondary">Проверяем статус оплаты...</p>
            )}
            {paymentError && <p className="mt-4 text-center text-sm text-error">{paymentError}</p>}
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
