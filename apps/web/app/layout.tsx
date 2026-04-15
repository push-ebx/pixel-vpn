import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Pixel VPN — VPN без границ",
  description: "Быстрый и безопасный VPN сервис для обхода блокировок. Поддержка всех платформ.",
  keywords: ["VPN", "vpn сервис", "обход блокировок", "безопасный интернет"],
  authors: [{ name: "Pixel VPN" }],
  openGraph: {
    title: "Pixel VPN — VPN без границ",
    description: "Быстрый и безопасный VPN сервис для обхода блокировок.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
