import { PaymentStatus, SubscriptionStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { getYooKassaPayment } from "./yookassa";
import { generateUserVlessUuid, buildVlessLink } from "../vpn/vless";
import { config } from "../config";
import { getXuiClient } from "../vpn/xui-client";

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function createXuiUserIfNeeded(
  userId: string,
  email: string,
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

  try {
    const xui = getXuiClient();

    const inbound = await xui.getInboundByTag(config.XUI_INBOUND_TAG);
    if (!inbound) {
      throw new Error(`Inbound with tag "${config.XUI_INBOUND_TAG}" not found`);
    }

    const xuiEmail = `pixel_${userId}`;

    const existingClient = await xui.getClientByEmail(xuiEmail);
    if (existingClient) {
      await xui.addDaysToClient(inbound.id, xuiEmail, expiryDays || 30);
      return { uuid: String(existingClient.id) };
    }

    const { uuid, vlessLink } = await xui.createClient(
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
  } catch (error) {
    console.error("Failed to create x-ui user:", error);
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
}

async function extendXuiUserSubscription(
  userId: string,
  email: string,
  inboundId: number,
  additionalDays: number
): Promise<void> {
  if (!config.XUI_ENABLED) {
    return;
  }

  try {
    const xui = getXuiClient();
    await xui.addDaysToClient(inboundId, email, additionalDays);
  } catch (error) {
    console.error("Failed to extend x-ui user subscription:", error);
  }
}

export async function markPaymentIntentPaid(intentId: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
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
      return intent;
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

    const hasExistingVpnAccount = Boolean(user?.vpnUuid);

    if (!hasExistingVpnAccount) {
      const { uuid } = await createXuiUserIfNeeded(
        intent.userId,
        intent.userId,
        intent.plan.durationDays
      );
      void uuid;
    } else if (user?.xuiEmail && user?.xuiInboundId != null) {
      await extendXuiUserSubscription(
        intent.userId,
        user.xuiEmail,
        user.xuiInboundId,
        intent.plan.durationDays
      );
    }

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

    return updatedIntent;
  });
}

export async function syncPaymentIntentStatus(intentId: string) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: intentId },
    include: { plan: true }
  });

  if (!intent) {
    throw new Error("Счет не найден");
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
