"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, WifiOff, Wifi, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export function NoDinoHero() {
  const [isClient, setIsClient] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsClient(true);

    // Блокируем прокрутку страницы при нажатии пробела только когда iframe в фокусе
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Проверяем, находится ли фокус внутри iframe или его контейнера
        const activeElement = document.activeElement;
        const iframeContainer = iframeRef.current?.parentElement;

        if (iframeContainer?.contains(activeElement) || activeElement === iframeRef.current) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Alert badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full mb-6">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">Без интернета?</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-white">Забудьте об этом</span>
                <br />
                <span className="text-green-500">динозаврике</span>
                <span className="text-slate-500"> навсегда</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-lg">
                NoDino VPN обеспечивает стабильное соединение 24/7.
                Никаких страниц "Нет подключения", никаких прерываний.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-slate-300">99.9% аптайм</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-slate-300">Стабильное соединение</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl group"
                  >
                    Начать без динозавриков
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                7 дней бесплатно • Отмена в любой момент
              </p>
            </motion.div>

            {/* Right: Dino Game */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Browser mockup */}
              <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                {/* Browser header */}
                <div className="bg-slate-700 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-600 rounded-md px-3 py-1.5 text-xs text-slate-400 flex items-center gap-2">
                      <WifiOff className="w-3 h-3" />
                      chrome://dino
                    </div>
                  </div>
                </div>

                {/* Error page */}
                <div className="p-4 text-center bg-white">
                  <div className="mb-2">
                    <svg className="w-10 h-10 mx-auto text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-slate-700 mb-1">
                    Нет подключения к интернету
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Попробуйте проверить кабели, модем и маршрутизатор.
                  </p>

                  {/* Dino Game - iframe */}
                  {isClient && (
                    <div className="relative w-full max-w-[350px] mx-auto">
                      <iframe
                        ref={iframeRef}
                        src="https://chromedino.com/"
                        width="100%"
                        height="180"
                        style={{ border: 'none', maxWidth: '350px' }}
                        title="Chrome Dino Game"
                        tabIndex={-1}
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 mt-2">
                    Нажмите пробел или ↑ чтобы прыгать
                  </p>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-slate-400 rounded-full" />
        </div>
      </div>
    </section>
  );
}
