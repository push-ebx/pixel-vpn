import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Clients } from "@/components/Landing/Clients";
import { HeaderClient } from "@/components/Landing/HeaderClient";
import { FooterClient } from "@/components/Landing/FooterClient";
import PricingClient from "./pricing/PricingClient";
import { getPlansServer } from "@/lib/plans";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Главная",
  description: `${SITE_NAME} — быстрый и безопасный VPN сервис с подключением через Нидерланды.`,
};

export default async function HomePage() {
  const landingSlug = "pixel-vpn";
  const plans = await getPlansServer(landingSlug);
  const offers = plans
    .filter((plan) => plan.code !== "trial-3d")
    .map((plan) => ({
      "@type": "Offer",
      priceCurrency: "RUB",
      price: String(plan.priceRub),
      priceValidUntil: "2030-12-31",
      availability: "https://schema.org/InStock",
      category: plan.name,
      url: `${SITE_URL}/#pricing`,
    }));

  const pricingStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${SITE_NAME} Subscription`,
    description: SITE_DESCRIPTION,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers,
  };

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <HeaderClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingStructuredData) }}
      />
      <Hero />
      <Features />
      <Suspense fallback={<section id="pricing" className="container mx-auto px-4 py-16 text-center text-text-secondary">Загружаем тарифы...</section>}>
        <PricingClient initialPlans={plans} landingSlug={landingSlug} />
      </Suspense>
      <Clients />
      <FooterClient />
    </main>
  );
}
