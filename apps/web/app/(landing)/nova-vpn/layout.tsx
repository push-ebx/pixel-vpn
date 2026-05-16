import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nova VPN — Быстрый и безопасный VPN для всех устройств",
  description: "Nova VPN обеспечивает высокоскоростное подключение, военное шифрование и доступ к любым сайтам. Попробуйте бесплатно.",
};

export default function NovaVpnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
