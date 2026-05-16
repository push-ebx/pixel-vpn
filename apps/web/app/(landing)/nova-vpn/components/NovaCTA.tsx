"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NovaCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Готовы к свободному интернету?
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Присоединяйтесь к 50 000+ пользователей, которые уже выбрали Nova VPN
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button
              size="lg"
              className="px-8 py-6 text-lg bg-white text-blue-600 hover:bg-blue-50 rounded-full group"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-blue-200 mt-6">
          7-дневная гарантия возврата средств
        </p>
      </div>
    </section>
  );
}
