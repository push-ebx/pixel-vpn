"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { useEffect } from "react";

export function FooterClient() {
  const { user, checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-accent bg-accent/15 text-accent flex items-center justify-center">
              <span className="font-pixel-title text-[13px]">P</span>
            </div>
            <p className="text-[14px] font-pixel-title text-text-secondary">
              pixel vpn
            </p>
          </div>

          <nav className="flex items-center gap-4 text-[12px] font-pixel-title tracking-[0.06em] text-text-secondary">
            <Link href="/pricing" className="hover:text-accent transition-colors text-[16px]">
              тарифы
            </Link>
            {user ? (
              <Link href="/dashboard" className="hover:text-accent transition-colors text-[16px]">
                аккаунт
              </Link>
            ) : (
              <Link href="/login" className="hover:text-accent transition-colors text-[16px]">
                вход
              </Link>
            )}
          </nav>

          <a
            href="https://t.me/pixel_v_p_n"
            target="_blank"
            rel="noopener noreferrer"
            className="uppercase px-2 border border-border inline-flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
            aria-label="Telegram"
          >
            Telegram
          </a>
        </div>

        <div className="py-4 border-t border-border text-[14px] text-text-secondary terminal-text">
          <p>© {new Date().getFullYear()} Pixel VPN. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
