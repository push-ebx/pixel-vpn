"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import * as api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { Shield, ExternalLink, Download } from "lucide-react";

interface Subscription {
  active: boolean;
  subscription: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELED";
    endsAt: string;
    remainingDays: number;
    plan: {
      name: string;
      durationDays: number;
    };
  } | null;
}

interface VlessData {
  link: string;
}

export default function DashboardClient() {
  const router = useRouter();
  const { user, checkAuth, isInitialized } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [vless, setVless] = useState<VlessData | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login");
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !user) {
      return;
    }

    const fetchData = async () => {
      const subRes = await api.getSubscription();

      if (subRes.data) {
        setSubscription(subRes.data);
      }

      if (subRes.data?.active) {
        const vlessRes = await api.getVless();
        if (vlessRes.data?.vless) {
          setVless(vlessRes.data.vless);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [isInitialized, user]);

  useEffect(() => {
    const endsAt = subscription?.subscription?.endsAt;
    if (!endsAt) {
      setRemainingMs(null);
      return;
    }

    const endsAtMs = new Date(endsAt).getTime();
    const updateRemaining = () => {
      const diff = endsAtMs - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 60_000);
    return () => window.clearInterval(intervalId);
  }, [subscription?.subscription?.endsAt]);

  const handleLogout = async () => {
    await api.logout();
    router.replace("/");
  };

  const formatRemaining = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60_000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days} д ${hours} ч ${minutes} мин`;
    }
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-text-secondary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-text-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-text-primary whitespace-nowrap">Pixel VPN</span>
          </Link>

          <div className="min-w-0 flex items-center justify-end gap-1 sm:gap-3">
            <span className="hidden sm:block text-sm text-text-secondary truncate max-w-[240px]">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={handleLogout}>
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {subscription?.active ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent" />
                    Подписка активна
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[minmax(0,1fr),auto] items-start gap-x-3 text-sm">
                      <span className="text-text-secondary">До окончания:</span>
                      <span className="text-accent font-medium text-right">
                        {remainingMs !== null ? formatRemaining(remainingMs) : "—"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr),auto] items-start gap-x-3 text-sm">
                      <span className="text-text-secondary">Истекает:</span>
                      <span className="text-text-primary text-right">
                        {new Date(subscription.subscription?.endsAt || "").toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {vless && (
                <Card>
                  <CardHeader>
                    <CardTitle>VLESS конфигурация</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-6">
                      <div className="bg-white p-4 rounded-lg">
                        <QRCodeSVG
                          value={vless.link}
                          size={200}
                          level="M"
                          includeMargin
                        />
                      </div>

                      <div className="w-full space-y-3">
                        <div>
                          <label className="text-sm text-text-secondary mb-1 block">VLESS ключ</label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <code className="w-full min-w-0 px-3 py-2 bg-card rounded border border-border text-sm text-text-primary font-mono break-all">
                              {vless.link}
                            </code>
                            <CopyButton text={vless.link} size="sm" className="self-end sm:self-auto shrink-0" />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary text-center">
                        Отсканируйте QR-код в приложении или скопируйте ссылку и добавьте вручную.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-text-primary font-medium">Нужно больше дней?</p>
                    <p className="text-sm text-text-secondary">Продлите подписку со скидкой</p>
                  </div>
                  <Link href="/pricing">
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Продлить
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-error" />
                    Нет активной подписки
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-text-secondary">
                    Приобретите подписку для получения VLESS конфигурации и доступа к VPN серверам.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/pricing" className="flex-1">
                      <Button className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Выбрать тариф
                      </Button>
                    </Link>
                    <Link href="/install/android" className="flex-1">
                      <Button variant="secondary" className="w-full">
                        Инструкция
                      </Button>
                    </Link>
                  </div>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
