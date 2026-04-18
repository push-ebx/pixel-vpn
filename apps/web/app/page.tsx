import type { Metadata } from "next";
import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Clients } from "@/components/Landing/Clients";
import { Footer } from "@/components/Landing/Footer";
import { Header } from "@/components/Landing/Header";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Главная",
  description: `${SITE_NAME} — быстрый и безопасный VPN сервис с подключением через Нидерланды.`,
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <Header />
      <Hero />
      <Features />
      <Clients />
      <Footer />
    </main>
  );
}
