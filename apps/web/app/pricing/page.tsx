import PricingClient, { Plan } from "./PricingClient";
import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru";

export const metadata: Metadata = {
  title: "Тарифы",
  description: `Тарифы ${SITE_NAME}. Подключение через Нидерланды, безопасный VPN и прозрачные цены в рублях.`,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: `Тарифы | ${SITE_NAME}`,
    description: `Тарифы ${SITE_NAME}. Подключение через Нидерланды и безопасный VPN.`,
    url: `${SITE_URL}/pricing`,
    images: [{ url: absoluteUrl("/og.png"), width: 1200, height: 630, alt: `${SITE_NAME} тарифы` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Тарифы | ${SITE_NAME}`,
    description: `Тарифы ${SITE_NAME}. Подключение через Нидерланды и безопасный VPN.`,
    images: [absoluteUrl("/og.png")],
  },
};

async function getPlansServer(): Promise<Plan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/plans`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { plans?: Plan[] };
    return Array.isArray(data.plans) ? data.plans : [];
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const plans = await getPlansServer();
  const offers = plans
    .filter((plan) => plan.code !== "trial-3d")
    .map((plan) => ({
      "@type": "Offer",
      priceCurrency: "RUB",
      price: String(plan.priceRub),
      priceValidUntil: "2030-12-31",
      availability: "https://schema.org/InStock",
      category: plan.name,
      url: `${SITE_URL}/pricing`,
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingStructuredData) }}
      />
      <PricingClient initialPlans={plans} />
    </>
  );
}
