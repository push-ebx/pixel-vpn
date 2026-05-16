"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "#features", label: "Почему мы" },
  { href: "#how-it-works", label: "Как работает" },
  { href: "#pricing", label: "Тарифы" },
];

export function NoDinoHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-900/95 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/nodino-vpn" className="flex items-center gap-3 group">
            {/* Pixel art dinosaur */}
            <div className="relative w-10 h-10">
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
                {/* Eye */}
                <rect x="26" y="14" width="2" height="2" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-bold">
              <span className="text-white">No</span>
              <span className="text-green-500">Dino</span>
              <span className="text-white">VPN</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                Войти
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0">
                Попробовать
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                <Link href="/login">
                  <Button variant="ghost" className="w-full justify-center text-slate-400">
                    Войти
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full justify-center bg-green-600 hover:bg-green-700">
                    Попробовать
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
