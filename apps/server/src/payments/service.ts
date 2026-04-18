import { PaymentStatus, SubscriptionStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { getYooKassaPayment } from "./yookassa";
import { generateUserVlessUuid } from "../vpn/vless";
import { config } from "../config";
import { getXuiClient } from "../vpn/xui-client";

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function createXuiUserIfNeeded(
  userId: string,
  expiryDays?: number
): Promise<{ uuid: string }> {
  if (!config.XUI_ENABLED) {
    const uuid = generateUserVlessUuid();
    await prisma.user.update({
      where: { id: userId },
      data: {
        vpnUuid: uuid,
        vpnUpdatedAt: new Date()
      }
    });
    return { uuid };
  }

  const xui = getXuiClient();

  const inbound = await xui.getFirstInbound();
  if (!inbound) {
    throw new Error("No inbound found in x-ui");
  }

  const xuiEmail = `pixel_${userId}`;
  const existingClient = await xui.findClientByEmail(xuiEmail);

  if (existingClient) {
    const uuid = existingClient.client.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        vpnUuid: uuid,
        xuiEmail,
        xuiInboundId: existingClient.inbound.id,
        vpnUpdatedAt: new Date()
      }
    });

    return { uuid };
  }

  const { uuid } = await xui.createClient(
    inbound.id,
    xuiEmail,
    expiryDays
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      vpnUuid: uuid,
      xuiEmail,
      xuiInboundId: inbound.id,
      vpnUpdatedAt: new Date()
    }
  });

  return { uuid };
}

async function extendXuiUserSubscription(
  email: string,
  inboundId: number,
  additionalDays: number
): Promise<void> {
  if (!config.XUI_ENABLED) {
    return;
  }

  const xui = getXuiClient();
  await xui.addDaysToClient(inboundId, email, additionalDays);
}

export async function markPaymentIntentPaid(intentId: string, userId?: string) {
  const txResult = await prisma.$transaction(async (tx) => {
    const intent = await tx.paymentIntent.findUnique({
      where: { id: intentId },
      include: { plan: true }
    });

    if (!intent) {
      throw new Error("Счет не найден");
    }

    if (userId && intent.userId !== userId) {
      throw new Error("Счет принадлежит другому пользователю");
    }

    if (intent.status === PaymentStatus.PAID) {
      const paidUser = await tx.user.findUnique({
        where: { id: intent.userId },
        select: {
          vpnUuid: true,
          xuiEmail: true,
          xuiInboundId: true
        }
      });

      if (config.XUI_ENABLED) {
        if (!paidUser?.vpnUuid || !paidUser.xuiEmail || paidUser.xuiInboundId == null) {
          return {
            paymentIntent: intent,
            xuiAction: "create" as const,
            xuiPayload: {
              userId: intent.userId,
              durationDays: intent.plan.durationDays
            }
          };
        }
      } else if (!paidUser?.vpnUuid) {
        return {
          paymentIntent: intent,
          xuiAction: "create" as const,
          xuiPayload: {
            userId: intent.userId,
            durationDays: intent.plan.durationDays
          }
        };
      }

      return {
        paymentIntent: intent,
        xuiAction: "none" as const
      };
    }

    if (intent.status !== PaymentStatus.PENDING) {
      throw new Error(`Невозможно подтвердить оплату в статусе: ${intent.status}`);
    }

    const now = new Date();

    if (intent.expiresAt <= now) {
      throw new Error("Срок действия счета истек");
    }

    const updatedIntent = await tx.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: now
      },
      include: { plan: true }
    });

    const user = await tx.user.findUnique({
      where: { id: intent.userId },
      select: {
        vpnUuid: true,
        xuiEmail: true,
        xuiInboundId: true
      }
    });

    const currentSubscription = await tx.subscription.findUnique({
      where: { userId: intent.userId }
    });

    const extensionBase =
      currentSubscription &&
      currentSubscription.status === SubscriptionStatus.ACTIVE &&
      currentSubscription.endsAt > now
        ? currentSubscription.endsAt
        : now;

    const endsAt = addDays(extensionBase, intent.plan.durationDays);

    if (currentSubscription) {
      await tx.subscription.update({
        where: { userId: intent.userId },
        data: {
          planId: intent.planId,
          paymentIntentId: intent.id,
          status: SubscriptionStatus.ACTIVE,
          startsAt: now,
          endsAt
        }
      });
    } else {
      await tx.subscription.create({
        data: {
          userId: intent.userId,
          planId: intent.planId,
          paymentIntentId: intent.id,
          status: SubscriptionStatus.ACTIVE,
          startsAt: now,
          endsAt
        }
      });
    }

    if (config.XUI_ENABLED) {
      if (!user?.vpnUuid || !user.xuiEmail || user.xuiInboundId == null) {
        return {
          paymentIntent: updatedIntent,
          xuiAction: "create" as const,
          xuiPayload: {
            userId: intent.userId,
            durationDays: intent.plan.durationDays
          }
        };
      }

      return {
        paymentIntent: updatedIntent,
        xuiAction: "extend" as const,
        xuiPayload: {
          userId: intent.userId,
          email: user.xuiEmail,
          inboundId: user.xuiInboundId,
          durationDays: intent.plan.durationDays
        }
      };
    } else if (!user?.vpnUuid) {
      return {
        paymentIntent: updatedIntent,
        xuiAction: "create" as const,
        xuiPayload: {
          userId: intent.userId,
          durationDays: intent.plan.durationDays
        }
      };
    }

    return {
      paymentIntent: updatedIntent,
      xuiAction: "none" as const
    };
  });

  if (txResult.xuiAction === "create") {
    await createXuiUserIfNeeded(
      txResult.xuiPayload.userId,
      txResult.xuiPayload.durationDays
    );
  } else if (txResult.xuiAction === "extend") {
    await extendXuiUserSubscription(
      txResult.xuiPayload.email,
      txResult.xuiPayload.inboundId,
      txResult.xuiPayload.durationDays
    );
  }

  return txResult.paymentIntent;
}

export async function syncPaymentIntentStatus(intentId: string) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: intentId },
    include: { plan: true }
  });

  if (!intent) {
    throw new Error("Счет не найден");
  }

  if (intent.status === PaymentStatus.PAID) {
    return markPaymentIntentPaid(intent.id);
  }

  if (intent.status !== PaymentStatus.PENDING) {
    return intent;
  }

  if (!intent.externalId) {
    return intent;
  }

  if (intent.expiresAt <= new Date()) {
    return prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PaymentStatus.EXPIRED },
      include: { plan: true }
    });
  }

  const provider = intent.provider.toLowerCase();
  if (provider !== "yookassa") {
    return intent;
  }

  const remotePayment = await getYooKassaPayment(intent.externalId);

  if (remotePayment.status === "succeeded" || remotePayment.paid) {
    return markPaymentIntentPaid(intent.id);
  }

  if (remotePayment.status === "canceled") {
    return prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: PaymentStatus.CANCELED },
      include: { plan: true }
    });
  }

  return intent;
}

export async function syncPendingPaymentsForUser(userId: string) {
  const pendingIntents = await prisma.paymentIntent.findMany({
    where: {
      userId,
      provider: "yookassa",
      status: PaymentStatus.PENDING
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  });

  for (const intent of pendingIntents) {
    try {
      await syncPaymentIntentStatus(intent.id);
    } catch {
      // Ignore individual sync failures, frontend can retry.
    }
  }
}
