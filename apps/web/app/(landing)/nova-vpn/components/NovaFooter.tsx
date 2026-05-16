"use client";

import Link from "next/link";
import { Shield, Send } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Возможности", href: "#features" },
    { label: "Тарифы", href: "#pricing" },
    { label: "Скачать", href: "#" },
    { label: "Обновления", href: "#" },
  ],
  company: [
    { label: "О нас", href: "#" },
    { label: "Блог", href: "#" },
    { label: "Карьера", href: "#" },
    { label: "Контакты", href: "#" },
  ],
  support: [
    { label: "Помощь", href: "#" },
    { label: "FAQ", href: "#faq" },
    { label: "Статус", href: "#" },
    { label: "Telegram", href: "https://t.me/novavpn" },
  ],
  legal: [
    { label: "Политика конфиденциальности", href: "#" },
    { label: "Условия использования", href: "#" },
    { label: "No-Logs Policy", href: "#" },
  ],
};

export function NovaFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/nova-vpn" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Nova VPN</span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-xs">
              Быстрый и безопасный VPN для свободного интернета. Без логов, без ограничений.
            </p>
            <a
              href="https://t.me/novavpn"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Продукт</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Компания</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Поддержка</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2024 Nova VPN. Все права защищены.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
