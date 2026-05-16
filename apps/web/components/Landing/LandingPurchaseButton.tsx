"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth";
import * as api from "@/lib/api";

type LandingPurchaseButtonProps = {
  planCode: string;
  landingSlug: string;
  children: ReactNode;
  className?: string;
};

export function LandingPurchaseButton({
  planCode,
  landingSlug,
  children,
  className,
}: LandingPurchaseButtonProps) {
  const router = useRouter();
  const { user, checkAuth, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  const handleClick = async () => {
    if (!user) {
      router.push(`/login?landing=${encodeURIComponent(landingSlug)}`);
      return;
    }

    setIsLoading(true);
    const { data, error } = await api.createPaymentIntent({ planCode, landingSlug });
    setIsLoading(false);

    if (error || !data?.paymentIntent) {
      return;
    }

    const paymentIntent = data.paymentIntent;
    if (paymentIntent.status === "paid" || paymentIntent.amountRub <= 0) {
      router.push("/install/android");
      return;
    }

    if (paymentIntent.yookassa?.checkoutUrl) {
      window.location.href = paymentIntent.yookassa.checkoutUrl;
      return;
    }
  };

  return (
    <Button type="button" className={className} onClick={handleClick} isLoading={isLoading}>
      {children}
    </Button>
  );
}
