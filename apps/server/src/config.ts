import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().default("*"),
  PAYMENT_INTENT_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  PAYMENT_RETURN_URL: z.string().url().default("https://yookassa.ru"),
  YOOKASSA_API_URL: z.string().url().default("https://api.yookassa.ru/v3"),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  SBP_MERCHANT_NAME: z.string().default("Pixel VPN"),
  SBP_MERCHANT_BANK: z.string().default("MVP Bank"),

  // x-ui API settings for managing VLESS users
  XUI_ENABLED: z.coerce.boolean().default(false),
  XUI_BASE_URL: z.string().default("http://localhost:2053"),
  XUI_USERNAME: z.string().default("admin"),
  XUI_PASSWORD: z.string().default("admin"),
  XUI_INBOUND_TAG: z.string().default("vless-reality"),
  XUI_FLOW: z.string().default("xtls-rprx-vision"),
  XUI_PORT: z.coerce.number().int().positive().default(443),

  // VPN (Xray Reality) server parameters used to build VLESS links for users.
  XRAY_HOST: z.string().min(1).default("127.0.0.1"),
  XRAY_PORT: z.coerce.number().int().positive().default(443),
  XRAY_PUBLIC_KEY: z.string().min(1).default("CHANGE-ME-PUBLIC-KEY"),
  XRAY_SNI: z.string().min(1).default("www.google.com"),
  XRAY_SHORT_ID: z.string().default(""),
  XRAY_FLOW: z.string().default("xtls-rprx-vision"),
  XRAY_FINGERPRINT: z.string().default("chrome")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const config = parsed.data;

export function getAllowedOrigins() {
  if (config.CORS_ORIGIN.trim() === "*") {
    return "*";
  }

  return config.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
