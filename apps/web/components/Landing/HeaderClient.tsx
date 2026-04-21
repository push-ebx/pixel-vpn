"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function HeaderClient() {
  const { user, checkAuth, isInitialized } = useAuthStore();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const loginHref = ref ? `/login?ref=${encodeURIComponent(ref)}` : "/login";

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur">
      <div className="container mx-auto h-full px-4">
        <nav className="h-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] md:text-[15px] font-pixel-title text-text-secondary hover:text-text-primary transition-colors"
          >
            <img src="/logo.svg" alt="Pixel VPN" className="h-7 w-7 rounded-[3px] shrink-0" />
            <span>pixel-vpn</span>
            <span className="text-text-secondary/40">::</span>
            <span className="text-accent">главная</span>
          </Link>

          <div className="flex items-center gap-1">
            {user ? (
              <Link
                href="/dashboard"
                className="h-10 px-3 inline-flex items-center border border-transparent text-[16px] font-pixel-title tracking-[0.06em] text-text-secondary hover:text-accent hover:border-border transition-colors"
              >
                аккаунт
              </Link>
            ) : (
              <Link
                href={loginHref}
                className="h-10 px-3 inline-flex items-center border border-transparent text-sm md:text-base font-pixel-title tracking-[0.06em] text-text-secondary hover:text-accent hover:border-border transition-colors"
              >
                вход
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
