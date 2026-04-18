import { Router } from "express";
import { z } from "zod";

import { requireAdmin, requireAuth } from "../auth/middleware";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const planIdSchema = z.string().min(1).max(191);

const createPromoCodeSchema = z.object({
  code: z.string().min(2).max(64),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).nullable().optional(),
  type: z.enum(["ONETIME", "PERMANENT"]),
  planId: planIdSchema.optional(),
  planIds: z.array(planIdSchema).min(1).optional(),
  expiresAt: z.string().datetime().optional()
}).refine((data) => Boolean(data.planId || (data.planIds && data.planIds.length > 0)), {
  message: "Нужно передать planId или planIds",
  path: ["planIds"]
});

const updatePromoCodeSchema = z.object({
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  planIds: z.array(planIdSchema).min(1).optional()
});

function mapPromoCodeResponse(promoCode: {
  plan: { id: string; code: string; name: string; priceRub: number; durationDays: number };
  planLinks: { plan: { id: string; code: string; name: string; priceRub: number; durationDays: number } }[];
} & Record<string, unknown>) {
  const plans = promoCode.planLinks.length > 0
    ? promoCode.planLinks.map((link) => link.plan)
    : [promoCode.plan];

  return {
    ...promoCode,
    plans
  };
}

adminRouter.get("/promocodes", asyncHandler(async (req, res) => {
  const [promoCodes, plans] = await Promise.all([
    prisma.promoCode.findMany({
      include: {
        plan: true,
        planLinks: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { priceRub: "asc" }]
    })
  ]);

  return res.json({ promoCodes: promoCodes.map(mapPromoCodeResponse), plans });
}));

adminRouter.post("/promocodes", asyncHandler(async (req, res) => {
  const parsed = createPromoCodeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { code, discountPercent, maxUses, type, planId, planIds, expiresAt } = parsed.data;
  const resolvedPlanIds = Array.from(new Set([...(planIds ?? []), ...(planId ? [planId] : [])]));

  const existing = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existing) {
    return res.status(409).json({ error: "Промокод уже существует" });
  }

  const plans = await prisma.plan.findMany({
    where: {
      id: { in: resolvedPlanIds },
      isActive: true
    }
  });

  if (plans.length !== resolvedPlanIds.length) {
    return res.status(404).json({ error: "Тариф не найден" });
  }

  const promoCode = await prisma.promoCode.create({
    data: {
      code: code.toUpperCase(),
      discountPercent,
      maxUses: maxUses ?? null,
      type,
      planId: resolvedPlanIds[0],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      planLinks: {
        create: resolvedPlanIds.map((id) => ({ planId: id }))
      }
    },
    include: {
      plan: true,
      planLinks: {
        include: { plan: true }
      }
    }
  });

  return res.status(201).json({ promoCode: mapPromoCodeResponse(promoCode) });
}));

adminRouter.patch("/promocodes/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const parsed = updatePromoCodeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Промокод не найден" });
  }

  const { discountPercent, maxUses, isActive, expiresAt, planIds } = parsed.data;
  const resolvedPlanIds = planIds ? Array.from(new Set(planIds)) : null;

  if (resolvedPlanIds) {
    const plans = await prisma.plan.findMany({
      where: {
        id: { in: resolvedPlanIds },
        isActive: true
      }
    });

    if (plans.length !== resolvedPlanIds.length) {
      return res.status(404).json({ error: "Тариф не найден" });
    }
  }

  const promoCode = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(discountPercent !== undefined && { discountPercent }),
      ...(maxUses !== undefined && { maxUses }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(resolvedPlanIds && {
        planId: resolvedPlanIds[0],
        planLinks: {
          deleteMany: {},
          create: resolvedPlanIds.map((planId) => ({ planId }))
        }
      })
    },
    include: {
      plan: true,
      planLinks: {
        include: { plan: true }
      }
    }
  });

  return res.json({ promoCode: mapPromoCodeResponse(promoCode) });
}));

adminRouter.delete("/promocodes/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Промокод не найден" });
  }

  await prisma.promoCode.delete({ where: { id } });

  return res.json({ success: true });
}));

export { adminRouter };
