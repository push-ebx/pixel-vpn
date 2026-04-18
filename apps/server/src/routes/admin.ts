import { Router } from "express";
import { z } from "zod";

import { getAuthUser, requireAdmin } from "../auth/middleware";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const adminRouter = Router();

adminRouter.use(requireAdmin);

const createPromoCodeSchema = z.object({
  code: z.string().min(2).max(64),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).optional(),
  type: z.enum(["ONETIME", "PERMANENT"]),
  planId: z.string().cuid(),
  expiresAt: z.string().datetime().optional()
});

const updatePromoCodeSchema = z.object({
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional()
});

adminRouter.get("/promocodes", asyncHandler(async (req, res) => {
  const [promoCodes, plans] = await Promise.all([
    prisma.promoCode.findMany({
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceRub: "asc" }
    })
  ]);

  return res.json({ promoCodes, plans });
}));

adminRouter.post("/promocodes", asyncHandler(async (req, res) => {
  const parsed = createPromoCodeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { code, discountPercent, maxUses, type, planId, expiresAt } = parsed.data;

  const existing = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existing) {
    return res.status(409).json({ error: "Промокод уже существует" });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return res.status(404).json({ error: "Тариф не найден" });
  }

  const promoCode = await prisma.promoCode.create({
    data: {
      code: code.toUpperCase(),
      discountPercent,
      maxUses: maxUses || null,
      type,
      planId,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    },
    include: { plan: true }
  });

  return res.status(201).json({ promoCode });
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

  const { discountPercent, maxUses, isActive, expiresAt } = parsed.data;

  const promoCode = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(discountPercent !== undefined && { discountPercent }),
      ...(maxUses !== undefined && { maxUses }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
    },
    include: { plan: true }
  });

  return res.json({ promoCode });
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