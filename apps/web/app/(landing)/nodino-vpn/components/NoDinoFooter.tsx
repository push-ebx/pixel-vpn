"use client";

import Link from "next/link";
import { Send, Heart } from "lucide-react";

export function NoDinoFooter() {
  return (
    <footer className="py-12 bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/nodino-vpn" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <rect x="8" y="20" width="4" height="4" fill="#535353"/>
                <rect x="12" y="16" width="4" height="4" fill="#535353"/>
                <rect x="16" y="16" width="4" height="4" fill="#535353"/>
                <rect x="20" y="16" width="4" height="4" fill="#535353"/>
                <rect x="24" y="12" width="4" height="4" fill="#535353"/>
                <rect x="28" y="12" width="4" height="4" fill="#535353"/>
                <rect x="24" y="20" width="4" height="4" fill="#535353"/>
                <rect x="28" y="20" width="4" height="4" fill="#535353"/>
                <rect x="12" y="24" width="4" height="4" fill="#535353"/>
                <rect x="16" y="24" width="4" height="4" fill="#535353"/>
                <rect x="8" y="28" width="4" height="4" fill="#535353"/>
                <rect x="16" y="28" width="4" height="4" fill="#535353"/>
                <rect x="20" y="8" width="4" height="4" fill="#535353"/>
                <rect x="26" y="14" width="2" height="2" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold">
              <span className="text-white">No</span>
              <span className="text-green-500">Dino</span>
              <span className="text-white">VPN</span>
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
            href="https://t.me/nodinovpn"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">@nodinovpn</span>
          </a>
        </div>

        <div className="text-center mt-8 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
            © 2024 NoDino VPN. Сделано с <Heart className="w-4 h-4 text-red-500 fill-red-500" /> для тех, кто устал от динозавриков.
          </p>
        </div>
      </div>
    </footer>
  );
}
