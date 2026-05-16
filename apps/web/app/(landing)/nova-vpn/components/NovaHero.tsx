"use client";

import Link from "next/link";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NovaHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/50 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-800">
              Более 50 000 активных пользователей
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Свободный интернет
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              без границ
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Nova VPN обеспечивает молниеносное соединение, военное шифрование 
            и доступ к любым сайтам. Никаких логов, никаких ограничений.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-600/25 group"
              >
                Начать бесплатно
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              className="px-8 py-6 text-lg rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Play className="mr-2 w-5 h-5" />
              Смотреть демо
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {[
              "Бесплатный пробный период",
              "Отмена в любой момент",
              "Поддержка 24/7",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image / Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl">
            <div className="rounded-2xl bg-white shadow-2xl shadow-blue-900/10 border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="bg-white rounded-md px-3 py-1.5 text-sm text-slate-400 border border-slate-200">
                    novavpn.app
                  </div>
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div>
                        <p className="text-sm text-slate-500">Статус</p>
                        <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Подключено
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Скорость</p>
                        <p className="text-lg font-semibold text-slate-900">245 Мбит/с</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-500">Сервер</p>
                        <p className="text-lg font-semibold text-slate-900">Нидерланды</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-500">Пинг</p>
                        <p className="text-lg font-semibold text-slate-900">12 мс</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                      <p className="text-sm opacity-80">Тариф</p>
                      <p className="text-xl font-bold">Premium</p>
                      <p className="text-2xl font-bold mt-2">299 ₽<span className="text-sm font-normal opacity-80">/мес</span></p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-sm text-slate-500">Трафик</p>
                      <p className="text-lg font-semibold text-slate-900">Безлимит</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
