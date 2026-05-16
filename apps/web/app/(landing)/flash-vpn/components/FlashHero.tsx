"use client";

import Link from "next/link";
import { ArrowRight, Zap, Activity, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export function FlashHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm text-purple-300">Новое поколение VPN</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-9xl font-bold mb-8 tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-cyan-400">
                FLASH VPN
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-400 mb-4 max-w-2xl mx-auto">
              Самый быстрый VPN в мире
            </p>

            <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto">
              Мгновенное подключение. Низкая задержка.
              Максимальная скорость на всех устройствах.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register">
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-0 rounded-none clip-path-slant group"
                >
                  <Zap className="mr-2 w-5 h-5" />
                  Подключиться
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { icon: Activity, value: "20ms", label: "Задержка" },
                { icon: Globe, value: "10Гб", label: "Канал" },
                { icon: Shield, value: "AES", label: "Шифрование" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </section>
  );
}
