import crypto from "node:crypto";

import { config } from "../config";

type YooKassaCreateInput = {
  paymentIntentId: string;
  userId: string;
  amountRub: number;
  description: string;
};

type YooKassaPaymentStatus = "pending" | "waiting_for_capture" | "succeeded" | "canceled";

type YooKassaPaymentResponse = {
  id: string;
  status: YooKassaPaymentStatus;
  paid: boolean;
  created_at: string;
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
};

function getAuthHeader() {
  const shopId = config.YOOKASSA_SHOP_ID?.trim();
  const secretKey = config.YOOKASSA_SECRET_KEY?.trim();

  if (!shopId || !secretKey) {
    throw new Error("Не настроены учетные данные YooKassa");
  }

  const token = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${token}`;
}

export function hasYooKassaCredentials() {
  const shopId = config.YOOKASSA_SHOP_ID?.trim();
  const secretKey = config.YOOKASSA_SECRET_KEY?.trim();
  return Boolean(shopId && secretKey);
}

async function parseYooKassaResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "description" in payload &&
      typeof (payload as { description: unknown }).description === "string"
        ? (payload as { description: string }).description
        : `Запрос в YooKassa завершился с ошибкой (код ${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function createYooKassaPayment(input: YooKassaCreateInput) {
  const amount = Math.max(0, input.amountRub);
  const idempotenceKey = crypto.randomUUID();

  const response = await fetch(`${config.YOOKASSA_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
      Authorization: getAuthHeader()
    },
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2),
        currency: "RUB"
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: config.PAYMENT_RETURN_URL
      },
      description: input.description.slice(0, 128),
      metadata: {
        payment_intent_id: input.paymentIntentId,
        user_id: input.userId
      }
    })
  });

  const payload = (await parseYooKassaResponse(response)) as YooKassaPaymentResponse;

  return {
    externalId: payload.id,
    status: payload.status,
    paid: payload.paid,
    confirmationUrl: payload.confirmation?.confirmation_url ?? null
  };
}

export async function getYooKassaPayment(paymentId: string) {
  const response = await fetch(`${config.YOOKASSA_API_URL}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader()
    }
  });

  const payload = (await parseYooKassaResponse(response)) as YooKassaPaymentResponse;

  return {
    externalId: payload.id,
    status: payload.status,
    paid: payload.paid
  };
}
