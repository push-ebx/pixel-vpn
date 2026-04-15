"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-center gap-8">
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Войти
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-text-primary">Pixel VPN</span>
          </Link>
          <Link href="/register" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Регистрация
          </Link>
        </nav>
      </div>
    </header>
  );
}
