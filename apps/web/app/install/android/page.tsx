"use client";

import Link from "next/link";
import Image from "next/image";
import { Shield, ChevronLeft, ExternalLink } from "lucide-react";
import { HeaderClient } from "@/components/Landing/HeaderClient";
import { FooterClient } from "@/components/Landing/FooterClient";

const steps = [
  {
    step: 1,
    title: "Установите приложение",
    description: "Скачайте Hiddify с Google Play",
    image: "/hiddify-android/photo_2026-04-18_21-07-19.jpg",
    links: [
      { label: "Google Play", url: "https://play.google.com/store/apps/details?id=app.hiddify.com" },
    ],
  },
  {
    step: 2,
    title: "Добавьте подписку",
    description: "Нажмите '+' → 'Добавить из буфера обмена' или отсканируйте QR из личного кабинета",
    image: "/hiddify-android/photo_2026-04-18_21-07-24.jpg",
    linkDashboard: true,
  },
  {
    step: 3,
    title: "Подключитесь",
    description: "Выберите сервер и нажмите 'Начать'",
  },
];

export default function AndroidInstallPage() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <HeaderClient />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <Link
              href="/pricing"
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Тарифы
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Android</h1>
                <p className="text-sm text-text-secondary">Настройка через Hiddify</p>
              </div>
            </div>

            <section>
              <h2 className="font-pixel-title text-lg tracking-[0.06em] mb-6">Подключение</h2>
              <div className="space-y-6">
                {steps.map((s) => (
                  <div key={s.step} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded bg-accent/20 text-accent flex items-center justify-center font-pixel-title shrink-0">
                        {s.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{s.title}</h3>
                        <p className="text-sm text-text-secondary mb-3">{s.description}</p>

                        {s.image && (
                          <div className="relative aspect-[9/16] max-h-[500px] w-[240px] mx-auto bg-background rounded-lg overflow-hidden mb-3">
                            <Image
                              src={s.image}
                              alt={s.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}

                        {s.links && (
                          <div className="flex flex-wrap gap-2">
                            {s.links.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded text-sm hover:border-accent transition-colors"
                              >
                                {link.label}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        {s.linkDashboard && (
                          <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-sm hover:bg-accent-hover transition-colors"
                          >
                            Личный кабинет
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <FooterClient />
    </main>
  );
}