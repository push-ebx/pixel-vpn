"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Minimal тема - чистый минималистичный дизайн
export function HeroMinimal() {
  return (
    <section className="pt-40 pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-neutral-900 mb-8 leading-[1.1]">
            VPN без сложностей
          </h1>
          
          <p className="text-lg text-neutral-500 mb-12 leading-relaxed max-w-xl">
            Подключение за 30 секунд. Никаких логов, никаких ограничений. 
            Просто работает.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/#pricing">
              <Button 
                size="lg" 
                className="group px-8 text-base bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                Подключить
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button 
                variant="ghost" 
                size="lg" 
                className="px-8 text-base underline-offset-4 hover:underline"
              >
                Узнать больше
              </Button>
            </Link>
          </div>

          {/* Минимальная статистика */}
          <div className="mt-20 pt-8 border-t border-neutral-200">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-light text-neutral-900">30+</p>
                <p className="text-sm text-neutral-500 mt-1">секунд на подключение</p>
              </div>
              <div>
                <p className="text-3xl font-light text-neutral-900">0</p>
                <p className="text-sm text-neutral-500 mt-1">лимитов трафика</p>
              </div>
              <div>
                <p className="text-3xl font-light text-neutral-900">99.9%</p>
                <p className="text-sm text-neutral-500 mt-1">время работы</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
