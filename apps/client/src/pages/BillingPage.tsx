import { open } from "@tauri-apps/plugin-shell";
import { useEffect, useMemo } from "react";
import type { ApiPlan } from "../lib/api";
import { useAccountStore } from "../stores/account-store";

const statusLabelMap: Record<string, string> = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  canceled: "canceled",
  expired: "expired"
};

function formatPrice(priceRub: number) {
  if (priceRub <= 0) {
    return "free";
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
  return `${fullDays}d ${hours}h`;
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
      <h1 className="font-pixel-title text-sm text-text-secondary">billing</h1>

      <div className="pixel-card p-3 flex flex-col gap-1">
        <p className="text-[10px] text-text-secondary terminal-text">subscription</p>
        {subscriptionLoading ? (
          <p className="text-xs text-text-secondary">loading...</p>
        ) : subscriptionActive && subscription ? (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-text-primary font-pixel-title">{subscription.plan.name}</p>
            <p className="text-[10px] text-text-secondary terminal-text">
              expires: {formatDate(subscription.endsAt)}
            </p>
            <p className="text-[10px] text-text-secondary terminal-text">
              remaining: {formatRemainingTime(subscription.remainingDays)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">inactive</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-pixel-title text-text-secondary">plans</p>
        {plansLoading && (
          <div className="pixel-card p-3 text-xs text-text-secondary">loading...</div>
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
                  {plan.durationDays}d · {formatPrice(plan.priceRub)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleBuy(plan)}
                disabled={paymentLoading}
                className="pixel-button text-[10px] py-1.5 px-3"
              >
                {plan.priceRub <= 0 ? "activate" : "buy"}
              </button>
            </div>
          ))}
      </div>

      {currentPayment && (
        <div className="pixel-card p-3 flex flex-col gap-2">
          <div>
            <p className="text-xs text-text-primary">{currentPayment.plan.name}</p>
            <p className="text-[10px] text-text-secondary terminal-text">
              {currentPayment.amountRub}₽ · expires {formatDate(currentPayment.expiresAt)}
            </p>
          </div>

          {currentPayment.status === "pending" && (
            <p className="text-[10px] text-text-secondary terminal-text">
              waiting for payment...
            </p>
          )}

          {paymentError && (
            <div className="terminal-text error text-[10px] p-2">
              {paymentError}
            </div>
          )}

          <p className="text-[10px] text-text-secondary terminal-text">
            status: <span className="text-text-primary">{statusLabelMap[currentPayment.status] ?? currentPayment.status}</span>
          </p>
        </div>
      )}
    </div>
  );
}