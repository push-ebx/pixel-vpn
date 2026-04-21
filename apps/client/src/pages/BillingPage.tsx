import { open } from "@tauri-apps/plugin-shell";
import { useEffect, useMemo } from "react";
import type { ApiPlan } from "../lib/api";
import { useAccountStore } from "../stores/account-store";

const statusLabelMap: Record<string, string> = {
  pending: "ожидает оплаты",
  paid: "оплачено",
  failed: "ошибка",
  canceled: "отменено",
  expired: "истекло"
};

function formatPrice(priceRub: number) {
  if (priceRub <= 0) {
    return "бесплатно";
  }
  return `${priceRub}₽`;
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
  return `${fullDays}д ${hours}ч`;
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
    refreshPaymentIntent,
    user,
    referrals,
    referralsLoading,
    referralsError,
    loadReferrals
  } = useAccountStore();

  const sortedPlans = useMemo(() => {
    return plans
      .filter((plan) => plan.priceRub > 0 && plan.code.toLowerCase() !== "trial")
      .sort((left, right) => left.priceRub - right.priceRub);
  }, [plans]);

  useEffect(() => {
    void loadSubscription();
    void loadReferrals();
  }, [loadSubscription, loadReferrals]);

  useEffect(() => {
    const refreshSubscription = () => {
      if (document.visibilityState !== "visible") return;
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
    if (!currentPayment || currentPayment.status !== "pending") return;

    const syncPayment = () => {
      if (document.visibilityState !== "visible") return;
      void refreshPaymentIntent(currentPayment.id);
    };

    syncPayment();
    const interval = window.setInterval(syncPayment, 3500);

    return () => window.clearInterval(interval);
  }, [currentPayment, refreshPaymentIntent]);

  async function handleBuy(plan: ApiPlan) {
    const intent = await createPaymentIntent({ planId: plan.id });
    const checkoutUrl = intent.yookassa?.checkoutUrl;

    if (!checkoutUrl) return;

    try {
      await open(checkoutUrl);
    } catch {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <h1 className="font-pixel-title text-sm text-text-secondary">ПОДПИСКА</h1>

      <div className="pixel-card p-3 flex flex-col gap-1">
        <p className="text-[10px] text-text-secondary terminal-text">подписка</p>
        {subscriptionLoading ? (
          <p className="text-xs text-text-secondary">загрузка...</p>
        ) : subscriptionActive && subscription ? (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-text-primary font-pixel-title">{subscription.plan.name}</p>
            <p className="text-[10px] text-text-secondary terminal-text">
              действует до: {formatDate(subscription.endsAt)}
            </p>
            <p className="text-[10px] text-text-secondary terminal-text">
              осталось: {formatRemainingTime(subscription.remainingDays)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">не активна</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-pixel-title text-text-secondary">тарифы</p>
        {plansLoading && (
          <div className="pixel-card p-3 text-xs text-text-secondary">загрузка...</div>
        )}
        {plansError && (
          <div className="terminal-text error text-xs p-2">{plansError}</div>
        )}

        {!plansLoading &&
          sortedPlans.map((plan) => (
            <div key={plan.id} className="pixel-card p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-primary">{plan.name}</p>
                <p className="text-[10px] text-text-secondary terminal-text">
                  {plan.durationDays}д · {formatPrice(plan.priceRub)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleBuy(plan)}
                disabled={paymentLoading}
                className="pixel-button text-[10px] py-1.5 px-3"
              >
                {plan.priceRub <= 0 ? "активировать" : "оплатить"}
              </button>
            </div>
          ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-pixel-title text-text-secondary">рефералы</p>
        {user && (
          <div className="pixel-card p-3 flex flex-col gap-1">
            <p className="text-[10px] text-text-secondary terminal-text">ваша реферальная ссылка</p>
            <p className="text-[10px] text-text-primary break-all select-all">
              https://pixel-vpn.ru?ref={user.email}
            </p>
          </div>
        )}
        {referralsLoading && (
          <div className="pixel-card p-3 text-xs text-text-secondary">загрузка...</div>
        )}
        {referralsError && (
          <div className="terminal-text error text-[10px] p-2">{referralsError}</div>
        )}
        {!referralsLoading && referrals.length === 0 && !referralsError && (
          <div className="pixel-card p-3 text-[10px] text-text-secondary terminal-text">
            нет оплативших рефералов
          </div>
        )}
        {!referralsLoading && referrals.map((ref) => (
          <div key={ref.email} className="pixel-card p-3 flex items-center justify-between">
            <p className="text-xs text-text-primary">{ref.email}</p>
            <p className="text-[10px] text-text-secondary terminal-text">{ref.totalPaid}₽</p>
          </div>
        ))}
      </div>

      {currentPayment && (
        <div className="pixel-card p-3 flex flex-col gap-2">
          <div>
            <p className="text-xs text-text-primary">{currentPayment.plan.name}</p>
            <p className="text-[10px] text-text-secondary terminal-text">
              {currentPayment.amountRub}₽ · до {formatDate(currentPayment.expiresAt)}
            </p>
          </div>

          {currentPayment.status === "pending" && (
            <p className="text-[10px] text-text-secondary terminal-text">
              ожидание оплаты...
            </p>
          )}

          {paymentError && (
            <div className="terminal-text error text-[10px] p-2">
              {paymentError}
            </div>
          )}

          <p className="text-[10px] text-text-secondary terminal-text">
            статус: <span className="text-text-primary">{statusLabelMap[currentPayment.status] ?? currentPayment.status}</span>
          </p>
        </div>
      )}
    </div>
  );
}
