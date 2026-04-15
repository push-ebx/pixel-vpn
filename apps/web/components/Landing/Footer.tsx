"use client";

import Link from "next/link";
import { Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-text-primary">Pixel VPN</span>
          </div>

          <nav className="flex items-center gap-8 text-sm text-text-secondary">
            <Link href="/pricing" className="hover:text-text-primary transition-colors">
              Тарифы
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Войти
            </Link>
            <Link href="/register" className="hover:text-text-primary transition-colors">
              Регистрация
            </Link>
          </nav>

          <a
            href="https://t.me/pixelvpn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <Send className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-text-secondary">
          <p>© {new Date().getFullYear()} Pixel VPN. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
