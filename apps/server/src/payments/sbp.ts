import crypto from "node:crypto";

import QRCode from "qrcode";

import { config } from "../config";

type BuildSbpInvoiceInput = {
  paymentIntentId: string;
  amountRub: number;
  description: string;
};

type BuildSbpInvoiceResult = {
  externalId: string;
  deepLink: string;
  qrDataUrl: string;
  isMock: true;
};

export async function buildSbpInvoice({
  paymentIntentId,
  amountRub,
  description
}: BuildSbpInvoiceInput): Promise<BuildSbpInvoiceResult> {
  const externalId = crypto.randomUUID();
  const encodedDescription = encodeURIComponent(description.slice(0, 64));

  // MVP placeholder link format for UI/testing.
  const deepLink =
    `sbp://pay?order=${encodeURIComponent(paymentIntentId)}` +
    `&external=${encodeURIComponent(externalId)}` +
    `&amount=${amountRub}` +
    `&merchant=${encodeURIComponent(config.SBP_MERCHANT_NAME)}` +
    `&bank=${encodeURIComponent(config.SBP_MERCHANT_BANK)}` +
    `&description=${encodedDescription}`;

  const qrDataUrl = await QRCode.toDataURL(deepLink, {
    margin: 2,
    width: 300
  });

  return {
    externalId,
    deepLink,
    qrDataUrl,
    isMock: true
  };
}
