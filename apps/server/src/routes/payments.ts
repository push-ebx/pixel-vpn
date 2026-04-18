import { PaymentStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { config } from "../config";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";
import { createYooKassaPayment, hasYooKassaCredentials } from "../payments/yookassa";
import { markPaymentIntentPaid, syncPaymentIntentStatus } from "../payments/service";

const paymentsRouter = Router();

const createIntentSchema = z
  .object({
    planId: z.string().cuid().optional(),
    planCode: z.string().min(2).max(64).optional()
  })
  .refine((input) => Boolean(input.planId || input.planCode), {
    message: "Нужно передать planId или planCode"
  });

function mapIntentStatus(status: PaymentStatus) {
  if (status === PaymentStatus.PENDING) return "pending";
  if (status === PaymentStatus.PAID) return "paid";
  if (status === PaymentStatus.FAILED) return "failed";
  if (status === PaymentStatus.CANCELED) return "canceled";
  return "expired";
}

paymentsRouter.post("/intents", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const parsed = createIntentSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { planId, planCode } = parsed.data;
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

  const expiresAt = new Date(Date.now() + config.PAYMENT_INTENT_TTL_MINUTES * 60_000);

  if (plan.priceRub <= 0) {
    const freeIntent = await prisma.paymentIntent.create({
      data: {
        userId: auth.id,
        planId: plan.id,
        amountRub: 0,
        provider: "free",
        status: PaymentStatus.PENDING,
        expiresAt
      }
    });

    const paidIntent = await markPaymentIntentPaid(freeIntent.id, auth.id);

    return res.status(201).json({
      paymentIntent: {
        id: paidIntent.id,
        status: mapIntentStatus(paidIntent.status),
        amountRub: paidIntent.amountRub,
        expiresAt: paidIntent.expiresAt,
        paidAt: paidIntent.paidAt,
        plan: {
          id: paidIntent.plan.id,
          code: paidIntent.plan.code,
          name: paidIntent.plan.name,
          durationDays: paidIntent.plan.durationDays
        },
        yookassa: {
          checkoutUrl: null
        }
      }
    });
  }

  if (!hasYooKassaCredentials()) {
    return res.status(503).json({
      error: "YooKassa не настроена на сервере. Укажите YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY."
    });
  }

  const intent = await prisma.paymentIntent.create({
    data: {
      userId: auth.id,
      planId: plan.id,
      amountRub: plan.priceRub,
      provider: "yookassa",
      status: PaymentStatus.PENDING,
      expiresAt
    }
  });

  let yookassaPayment: Awaited<ReturnType<typeof createYooKassaPayment>>;
  try {
    yookassaPayment = await createYooKassaPayment({
      paymentIntentId: intent.id,
      userId: auth.id,
      amountRub: intent.amountRub,
      description: `Pixel VPN ${plan.name}`
    });
  } catch (error) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PaymentStatus.FAILED }
    });
    return res.status(503).json({
      error: error instanceof Error ? error.message : "Не удалось создать платеж в YooKassa"
    });
  }

  const updatedIntent = await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: {
      externalId: yookassaPayment.externalId,
      sbpDeepLink: yookassaPayment.confirmationUrl
    },
    include: { plan: true }
  });

  return res.status(201).json({
    paymentIntent: {
      id: updatedIntent.id,
      status: mapIntentStatus(updatedIntent.status),
      amountRub: updatedIntent.amountRub,
      expiresAt: updatedIntent.expiresAt,
      plan: {
        id: updatedIntent.plan.id,
        code: updatedIntent.plan.code,
        name: updatedIntent.plan.name,
        durationDays: updatedIntent.plan.durationDays
      },
      yookassa: {
        checkoutUrl: updatedIntent.sbpDeepLink
      }
    }
  });
}));

paymentsRouter.get("/intents/:intentId", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const intentId = req.params.intentId;

  let intent = await prisma.paymentIntent.findUnique({
    where: { id: intentId },
    include: { plan: true }
  });

  if (!intent || intent.userId !== auth.id) {
    return res.status(404).json({ error: "Счет не найден" });
  }

  if (intent.status === PaymentStatus.PENDING || intent.status === PaymentStatus.PAID) {
    try {
      intent = await syncPaymentIntentStatus(intent.id);
    } catch {
      // ignore sync errors for status query endpoint; frontend can retry
    }
  }

  return res.json({
    paymentIntent: {
      id: intent.id,
      status: mapIntentStatus(intent.status),
      amountRub: intent.amountRub,
      expiresAt: intent.expiresAt,
      paidAt: intent.paidAt,
      plan: {
        id: intent.plan.id,
        code: intent.plan.code,
        name: intent.plan.name,
        durationDays: intent.plan.durationDays
      },
      yookassa: {
        checkoutUrl: intent.sbpDeepLink ?? null
      }
    }
  });
}));

paymentsRouter.post("/intents/:intentId/mock-success", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const intentId = req.params.intentId;

  try {
    const updated = await markPaymentIntentPaid(intentId, auth.id);
    return res.json({
      ok: true,
      paymentIntent: {
        id: updated.id,
        status: mapIntentStatus(updated.status),
        paidAt: updated.paidAt
      }
    });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Не удалось подтвердить оплату"
    });
  }
}));

export { paymentsRouter };
