export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceRub: number;
  durationDays: number;
  landingSlug: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru";

const LANDING_PLAN_CODES: Record<string, string[]> = {
  "pixel-vpn": ["day-1", "basic-30d", "pro-90d", "semiannual-180d", "annual-365d"],
  "nova-vpn": ["nova-basic-30d", "nova-premium-30d", "nova-family-30d"],
  "flash-vpn": ["flash-starter-30d", "flash-30d", "flash-ultra-30d"],
  "nodino-vpn": ["nodino-basic-30d", "nodino-pro-30d", "nodino-max-30d"],
};

export function filterPlansForLanding(plans: Plan[], landingSlug = "pixel-vpn") {
  const allowedCodes = LANDING_PLAN_CODES[landingSlug] ?? [];
  const filtered = plans.filter((plan) => {
    if (plan.landingSlug === landingSlug) {
      return true;
    }

    return allowedCodes.includes(plan.code);
  });

  if (allowedCodes.length === 0) {
    return filtered;
  }

  return filtered.sort((a, b) => {
    const aIndex = allowedCodes.indexOf(a.code);
    const bIndex = allowedCodes.indexOf(b.code);
    return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
  });
}

export async function getPlansServer(landingSlug = "pixel-vpn"): Promise<Plan[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/plans`);
    url.searchParams.set("landing", landingSlug);

    const response = await fetch(url.toString(), {
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
    return Array.isArray(data.plans) ? filterPlansForLanding(data.plans, landingSlug) : [];
  } catch {
    return [];
  }
}
