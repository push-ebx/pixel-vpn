import { SubscriptionStatus } from "@prisma/client";
import { Router } from "express";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";
import { syncPendingPaymentsForUser } from "../payments/service";
import { buildVlessLink } from "../vpn/vless";

const subscriptionRouter = Router();

subscriptionRouter.get("/current", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const now = new Date();

  await syncPendingPaymentsForUser(auth.id);

  const subscription = await prisma.subscription.findUnique({
    where: { userId: auth.id },
    include: { plan: true }
  });

  if (!subscription) {
    return res.json({
      active: false,
      subscription: null
    });
  }

  let normalizedSubscription = subscription;
  if (subscription.status === SubscriptionStatus.ACTIVE && subscription.endsAt <= now) {
    normalizedSubscription = await prisma.subscription.update({
      where: { userId: auth.id },
      data: { status: SubscriptionStatus.EXPIRED },
      include: { plan: true }
    });
  }

  const isActive =
    normalizedSubscription.status === SubscriptionStatus.ACTIVE &&
    normalizedSubscription.endsAt > now;

  const remainingMs = Math.max(0, normalizedSubscription.endsAt.getTime() - now.getTime());
  const remainingDays = Number((remainingMs / (1000 * 60 * 60 * 24)).toFixed(2));

  return res.json({
    active: isActive,
    subscription: {
      id: normalizedSubscription.id,
      status: normalizedSubscription.status,
      startsAt: normalizedSubscription.startsAt,
      endsAt: normalizedSubscription.endsAt,
      remainingDays,
      plan: {
        id: normalizedSubscription.plan.id,
        code: normalizedSubscription.plan.code,
        name: normalizedSubscription.plan.name,
        priceRub: normalizedSubscription.plan.priceRub,
        durationDays: normalizedSubscription.plan.durationDays
      }
    }
  });
}));

subscriptionRouter.get("/vless", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const now = new Date();

  await syncPendingPaymentsForUser(auth.id);

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: {
      vpnUuid: true,
      email: true,
      xuiEmail: true,
      xuiInboundId: true
    }
  });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: auth.id }
  });

  const active =
    Boolean(subscription) &&
    subscription!.status === SubscriptionStatus.ACTIVE &&
    subscription!.endsAt > now;

  if (!active) {
    return res.status(403).json({ error: "Подписка не активна" });
  }

  if (!user?.vpnUuid) {
    return res.status(409).json({ error: "VPN ключ еще не сгенерирован" });
  }

  let vlessLink = buildVlessLink({ uuid: user.vpnUuid, label: "PixelVPN" });

  return res.json({
    vless: {
      uuid: user.vpnUuid,
      link: vlessLink,
      xuiEnabled: Boolean(user.xuiEmail && user.xuiInboundId)
    }
  });
}));

export { subscriptionRouter };
