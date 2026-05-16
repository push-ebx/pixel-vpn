"use client";

import Link from "next/link";
import { Zap, Send } from "lucide-react";

export function FlashFooter() {
  return (
    <footer className="py-12 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/flash-vpn" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold">
              <span className="text-purple-400">FLASH</span>
              <span className="text-cyan-400">VPN</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex gap-8">
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
              Политика
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
              Условия
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
              Поддержка
            </a>
          </div>

          {/* Social */}
          <a
            href="https://t.me/flashvpn"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">@flashvpn</span>
          </a>
        </div>

        <p className="text-center text-slate-600 text-sm mt-8">
          © 2024 Flash VPN. Скорость — наше всё.
        </p>
      </div>
    </footer>
  );
}
