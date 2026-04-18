import { SubscriptionStatus } from "@prisma/client";
import { Router } from "express";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";
import { syncPendingPaymentsForUser } from "../payments/service";
import { buildVlessLink } from "../vpn/vless";
import { createXuiClient, XuiClientError } from "../vpn/xui-client";

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

subscriptionRouter.post("/vless/xui", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const body = (req.body ?? {}) as Record<string, unknown>;

  const xuiUsername = typeof body.xuiUsername === "string" ? body.xuiUsername.trim() : "";
  const xuiPassword = typeof body.xuiPassword === "string" ? body.xuiPassword.trim() : "";
  const xuiBaseUrl = typeof body.xuiBaseUrl === "string" ? body.xuiBaseUrl.trim() : undefined;
  const inboundTag = typeof body.inboundTag === "string" ? body.inboundTag.trim() : undefined;
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "PixelVPN";

  const inboundIdRaw = body.inboundId;
  const parsedInboundId =
    typeof inboundIdRaw === "number" && Number.isInteger(inboundIdRaw)
      ? inboundIdRaw
      : typeof inboundIdRaw === "string" && /^\d+$/.test(inboundIdRaw.trim())
        ? Number(inboundIdRaw.trim())
        : undefined;

  const expiryDaysRaw = body.expiryDays;
  const parsedExpiryDays =
    typeof expiryDaysRaw === "number" && Number.isInteger(expiryDaysRaw) && expiryDaysRaw > 0
      ? expiryDaysRaw
      : typeof expiryDaysRaw === "string" && /^\d+$/.test(expiryDaysRaw.trim()) && Number(expiryDaysRaw.trim()) > 0
        ? Number(expiryDaysRaw.trim())
        : undefined;

  if (!xuiUsername || !xuiPassword) {
    return res.status(400).json({
      error: "Укажите xuiUsername и xuiPassword"
    });
  }

  if (parsedInboundId == null && !inboundTag) {
    return res.status(400).json({
      error: "Укажите inboundId или inboundTag"
    });
  }

  const xui = createXuiClient({
    username: xuiUsername,
    password: xuiPassword,
    baseUrl: xuiBaseUrl
  });

  try {
    const inbound = parsedInboundId != null
      ? await xui.getInboundById(parsedInboundId)
      : await xui.getInboundByTag(inboundTag!);

    if (!inbound) {
      return res.status(404).json({
        error: "Inbound не найден в x-ui"
      });
    }

    const xuiEmail = `pixel_${auth.id}`;
    const existingClient = inbound.clients.find((client) => client.email === xuiEmail);

    let uuid: string;
    let created = false;

    if (existingClient) {
      uuid = String(existingClient.id);
      if (parsedExpiryDays) {
        const currentExpiry = existingClient.expiryTime || Date.now();
        const existingDays = Math.max(
          0,
          Math.ceil((currentExpiry - Date.now()) / (24 * 60 * 60 * 1000))
        );
        await xui.updateClientExpiry(inbound.id, xuiEmail, existingDays + parsedExpiryDays);
      }
    } else {
      const createdClient = await xui.createClient(inbound.id, xuiEmail, parsedExpiryDays);
      uuid = createdClient.uuid;
      created = true;
    }

    await prisma.user.update({
      where: { id: auth.id },
      data: {
        vpnUuid: uuid,
        xuiEmail,
        xuiInboundId: inbound.id,
        vpnUpdatedAt: new Date()
      }
    });

    return res.json({
      vless: {
        uuid,
        link: xui.createVlessLink(uuid, label, inbound.port),
        inboundId: inbound.id,
        inboundTag: inbound.tag,
        created
      }
    });
  } catch (error) {
    if (error instanceof XuiClientError) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return res.status(401).json({ error: "Неверный логин или пароль x-ui" });
      }

      return res.status(502).json({ error: `Ошибка x-ui: ${error.message}` });
    }

    throw error;
  }
}));

export { subscriptionRouter };
