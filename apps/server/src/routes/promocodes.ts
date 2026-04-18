import { Router } from "express";
import { z } from "zod";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const promoCodesRouter = Router();
promoCodesRouter.use(requireAuth);

const planIdSchema = z.string().min(1).max(191);

const validatePromoCodeSchema = z.object({
  code: z.string().min(2).max(64)
});

const applyPromoCodeSchema = z.object({
  planId: planIdSchema.optional(),
  planCode: z.string().min(2).max(64).optional(),
  promoCode: z.string().min(2).max(64)
});

function mapPromoCodeType(type: "ONETIME" | "PERMANENT") {
  return type === "ONETIME" ? "onetime" : "permanent";
}

promoCodesRouter.post("/validate", asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const parsed = validatePromoCodeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { code } = parsed.data;
  const now = new Date();

  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      plan: true,
      planLinks: {
        include: { plan: true }
      }
    }
  });

  if (!promoCode) {
    return res.status(404).json({ valid: false, error: "Промокод не найден" });
  }

  if (!promoCode.isActive) {
    return res.status(400).json({ valid: false, error: "Промокод деактивирован" });
  }

  if (promoCode.expiresAt && promoCode.expiresAt <= now) {
    return res.status(400).json({ valid: false, error: "Срок действия промокода истек" });
  }

  if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
    return res.status(400).json({ valid: false, error: "Лимит использований исчерпан" });
  }

  if (promoCode.type === "ONETIME") {
    const usage = await prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId: auth.id
        }
      }
    });

    if (usage) {
      return res.status(400).json({ valid: false, error: "Вы уже использовали этот промокод" });
    }
  }

  const plans = promoCode.planLinks.length > 0
    ? promoCode.planLinks.map((link) => link.plan)
    : [promoCode.plan];

  return res.json({
    valid: true,
    promoCode: {
      id: promoCode.id,
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
      type: mapPromoCodeType(promoCode.type),
      plan: {
        id: plans[0].id,
        code: plans[0].code,
        name: plans[0].name,
        priceRub: plans[0].priceRub,
        durationDays: plans[0].durationDays
      },
      plans: plans.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        priceRub: plan.priceRub,
        durationDays: plan.durationDays
      }))
    }
  });
}));

promoCodesRouter.post("/apply", asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const parsed = applyPromoCodeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { planId, planCode, promoCode: codeInput } = parsed.data;
  const code = codeInput.toUpperCase();
  const now = new Date();

  const plan = await prisma.plan.findFirst({
    where: {
      isActive: true,
      ...(planId ? { id: planId } : {}),
      ...(planCode ? { code: planCode } : {})
    }
  });

  if (!plan) {
    return res.status(404).json({ error: "Тариф не найден" });
  }

  const promoCode = await prisma.promoCode.findUnique({
    where: { code },
    include: {
      plan: true,
      planLinks: true
    }
  });

  if (!promoCode) {
    return res.status(404).json({ error: "Промокод не найден" });
  }

  if (!promoCode.isActive) {
    return res.status(400).json({ error: "Промокод деактивирован" });
  }

  if (promoCode.expiresAt && promoCode.expiresAt <= now) {
    return res.status(400).json({ error: "Срок действия промокода истек" });
  }

  if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
    return res.status(400).json({ error: "Лимит использований исчерпан" });
  }

  if (promoCode.type === "ONETIME") {
    const existingUsage = await prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId: auth.id
        }
      }
    });

    if (existingUsage) {
      return res.status(400).json({ error: "Вы уже использовали этот промокод" });
    }
  }

  const applicablePlanIds = promoCode.planLinks.length > 0
    ? promoCode.planLinks.map((link) => link.planId)
    : [promoCode.planId];

  if (!applicablePlanIds.includes(plan.id)) {
    return res.status(400).json({ error: "Промокод не действует для выбранного тарифа" });
  }

  const finalPrice = Math.round(plan.priceRub * (1 - promoCode.discountPercent / 100));

  if (promoCode.discountPercent >= 100) {
    await prisma.$transaction(async (tx) => {
      await tx.promoCodeUsage.create({
        data: {
          promoCodeId: promoCode.id,
          userId: auth.id
        }
      });

      await tx.promoCode.update({
        where: { id: promoCode.id },
        data: { usedCount: { increment: 1 } }
      });
    });

    const { markPaymentIntentPaid } = await import("../payments/service");
    const freePlan = await prisma.plan.findFirst({
      where: { code: "TRIAL", isActive: true }
    });

    if (!freePlan) {
      return res.status(500).json({ error: "Тариф для бесплатного промокода не найден" });
    }

    const expiresAt = new Date(Date.now() + 15 * 60_000);

    const intent = await prisma.paymentIntent.create({
      data: {
        userId: auth.id,
        planId: freePlan.id,
        amountRub: 0,
        provider: "promocode",
        status: "PAID",
        expiresAt,
        paidAt: now
      }
    });

    await markPaymentIntentPaid(intent.id, auth.id);

    return res.json({
      success: true,
      applied: true,
      free: true,
      discountPercent: promoCode.discountPercent,
      message: "Промокод активирован! VPN ключ создан."
    });
  }

  return res.json({
    success: true,
    applied: false,
    free: false,
    discountPercent: promoCode.discountPercent,
    finalPrice,
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      originalPrice: plan.priceRub,
      durationDays: plan.durationDays
    }
  });
}));

export { promoCodesRouter };
