import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const plansRouter = Router();
const DEFAULT_LANDING_SLUG = "pixel-vpn";

function normalizeLandingSlug(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_LANDING_SLUG;
  }

  const slug = value.trim().toLowerCase();
  return /^[a-z0-9-]{2,64}$/.test(slug) ? slug : DEFAULT_LANDING_SLUG;
}

plansRouter.get("/", asyncHandler(async (req, res) => {
  const landingSlug = normalizeLandingSlug(req.query.landing);
  const plans = await prisma.plan.findMany({
    where: { isActive: true, landingSlug },
    orderBy: [{ order: "asc" }, { priceRub: "asc" }, { durationDays: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      landingSlug: true,
      order: true,
      priceRub: true,
      durationDays: true
    }
  });

  return res.json({ plans });
}));

export { plansRouter };
