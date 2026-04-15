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
  SBP_MERCHANT_BANK: z.string().default("MVP Bank")
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
