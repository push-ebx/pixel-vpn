"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth";
import * as api from "@/lib/api";
import { Shield, LogOut, ExternalLink, Download } from "lucide-react";

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

export default function DashboardPage() {
  const { user, isInitialized, checkAuth, logout } = useAuthStore();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [vless, setVless] = useState<VlessData | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login");
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const subRes = await api.getSubscription();

      if (subRes.data) {
        setSubscription(subRes.data);
      }

      if (subRes.data?.active) {
        const vlessRes = await api.getVless();
        if (vlessRes.data?.vless) {
          setVless(vlessRes.data.vless);
        } else {
          setVless(null);
        }
      } else {
        setVless(null);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-text-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-text-primary">Pixel VPN</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
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
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Тариф:</span>
                      <span className="text-text-primary font-medium">
                        {subscription.subscription?.plan.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Осталось дней:</span>
                      <span className="text-accent font-medium">
                        {subscription.subscription?.remainingDays}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">До окончания:</span>
                      <span className="text-accent font-medium">
                        {remainingMs !== null ? formatRemaining(remainingMs) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Истекает:</span>
                      <span className="text-text-primary">
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
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-card rounded border border-border text-sm text-text-primary font-mono break-all">
                              {vless.link}
                            </code>
                            <CopyButton text={vless.link} />
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
                  <Link href="/" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      На главную
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
