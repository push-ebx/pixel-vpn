import { open } from "@tauri-apps/plugin-shell";
import { useEffect, useMemo } from "react";
import type { ApiPlan } from "../lib/api";
import { useAccountStore } from "../stores/account-store";

const paymentStatusLabelMap: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Ошибка",
  canceled: "Отменен",
  expired: "Истек"
};

function formatPrice(priceRub: number) {
  if (priceRub <= 0) {
    return "Бесплатно";
  }

  return `${priceRub} ₽`;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}

function formatRemainingTime(days: number) {
  const totalMinutes = Math.max(0, Math.floor(days * 24 * 60));
  const fullDays = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return `${fullDays} д ${hours} ч ${minutes} мин`;
}

export default function BillingPage() {
  const {
    plans,
    plansLoading,
    plansError,
    subscription,
    subscriptionActive,
    subscriptionLoading,
    loadSubscription,
    createPaymentIntent,
    currentPayment,
    paymentLoading,
    paymentError,
    refreshPaymentIntent
  } = useAccountStore();

  const sortedPlans = useMemo(() => {
    return plans
      .filter((plan) => plan.priceRub > 0 && plan.code.toLowerCase() !== "trial")
      .sort((left, right) => left.priceRub - right.priceRub);
  }, [plans]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    const refreshSubscription = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void loadSubscription();
    };

    window.addEventListener("focus", refreshSubscription);
    document.addEventListener("visibilitychange", refreshSubscription);

    return () => {
      window.removeEventListener("focus", refreshSubscription);
      document.removeEventListener("visibilitychange", refreshSubscription);
    };
  }, [loadSubscription]);

  useEffect(() => {
    if (!currentPayment || currentPayment.status !== "pending") {
      return;
    }

    const syncPayment = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshPaymentIntent(currentPayment.id);
    };

    syncPayment();
    const interval = window.setInterval(syncPayment, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentPayment, refreshPaymentIntent]);

  async function handleBuy(plan: ApiPlan) {
    const intent = await createPaymentIntent({ planId: plan.id });
    const checkoutUrl = intent.yookassa?.checkoutUrl;

    if (!checkoutUrl) {
      return;
    }

    try {
      await open(checkoutUrl);
    } catch {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      <h1 className="text-4xl font-semibold text-text-primary">Тарифы и оплата</h1>

      <div className="pixel-card bg-bg-card p-4 flex flex-col gap-2">
        <p className="text-sm text-text-secondary">Статус подписки</p>
        {subscriptionLoading ? (
          <p className="text-sm text-text-primary">Загрузка...</p>
        ) : subscriptionActive && subscription ? (
          <>
            <p className="text-base font-semibold text-accent">{subscription.plan.name}</p>
            <p className="text-sm text-text-secondary">
              Активна до {formatDate(subscription.endsAt)}
            </p>
            <p className="text-sm text-text-secondary">Осталось {formatRemainingTime(subscription.remainingDays)}</p>
          </>
        ) : (
          <p className="text-sm text-text-primary">Подписка не активна</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-text-primary">Доступные планы</p>
        {plansLoading && (
          <div className="pixel-card bg-bg-card p-4 text-sm text-text-secondary">Загрузка тарифов...</div>
        )}
        {plansError && (
          <div className="pixel-card bg-danger/10 border-danger/30 p-3 text-sm text-danger">{plansError}</div>
        )}

        {!plansLoading &&
          sortedPlans.map((plan) => (
            <div key={plan.id} className="pixel-card bg-bg-card p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-text-primary">{plan.name}</p>
                <p className="text-sm text-text-secondary">
                  {plan.durationDays} дн. • {formatPrice(plan.priceRub)}
                </p>
                {plan.description && (
                  <p className="text-xs text-text-secondary mt-1">{plan.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleBuy(plan)}
                disabled={paymentLoading}
                className="h-10 px-4 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {plan.priceRub <= 0 ? "Активировать" : "Оплатить"}
              </button>
            </div>
          ))}
      </div>

      {currentPayment && (
        <div className="pixel-card bg-bg-card p-4 flex flex-col gap-3">
          <div>
            <p className="text-base font-semibold text-text-primary">
              Счет: {currentPayment.plan.name}
            </p>
            <p className="text-sm text-text-secondary">
              {currentPayment.amountRub} ₽ • до {formatDate(currentPayment.expiresAt)}
            </p>
          </div>

          {currentPayment.status === "pending" && (
            <p className="text-sm text-text-secondary">
              Ожидаем подтверждение оплаты от YooKassa...
            </p>
          )}

          {paymentError && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {paymentError}
            </div>
          )}

          <p className="text-xs text-text-secondary">
            Статус платежа:{" "}
            <span className="font-semibold text-text-primary">
              {paymentStatusLabelMap[currentPayment.status] ?? currentPayment.status}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
