import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const plansRouter = Router();

plansRouter.get("/", asyncHandler(async (_req, res) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { priceRub: "asc" }, { durationDays: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      order: true,
      priceRub: true,
      durationDays: true
    }
  });

  return res.json({ plans });
}));

export { plansRouter };
