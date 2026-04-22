import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { signAccessToken } from "../auth/jwt";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";
import { notifyNewUserRegistered } from "../bot/admin-notify";

const authRouter = Router();
const AUTH_COOKIE_NAME = "pixel-vpn-web-auth-token";
const AUTH_COOKIE_OPTIONS = {
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "lax" as const,
  path: "/"
};

function generateReferralCode(): string {
  return crypto.randomBytes(6).toString("base64url");
}

async function ensureUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!existing) return code;
  }
  // fallback: add timestamp suffix to guarantee uniqueness
  return generateReferralCode() + Date.now().toString(36).slice(-3);
}

const registerSchema = z.object({
  email: z.string().email().max(191).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8).max(72),
  referralCode: z.string().max(16).optional()
});

const loginSchema = z.object({
  email: z.string().email().max(191).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8).max(72)
});

authRouter.post("/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { email, password, referralCode: referrerCode } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "Эта почта уже используется" });
  }

  let referredByUserId: string | undefined;
  let referredByEmail: string | null = null;
  if (referrerCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referrerCode },
      select: { id: true, email: true }
    });
    if (referrer) {
      referredByUserId = referrer.id;
      referredByEmail = referrer.email;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newReferralCode = await ensureUniqueReferralCode();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      referralCode: newReferralCode,
      ...(referredByUserId ? { referredByUserId } : {})
    }
  });

  await notifyNewUserRegistered({
    email: user.email,
    userId: user.id,
    referredByEmail
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    isAdmin: user.isAdmin
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, AUTH_COOKIE_OPTIONS);

  return res.status(201).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      referralCode: user.referralCode
    }
  });
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Неверная почта или пароль" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Неверная почта или пароль" });
  }

  // lazy-generate referralCode for users registered before this feature
  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = await ensureUniqueReferralCode();
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    isAdmin: user.isAdmin
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, AUTH_COOKIE_OPTIONS);

  return res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      referralCode
    }
  });
}));

authRouter.post("/logout", asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
    sameSite: AUTH_COOKIE_OPTIONS.sameSite,
    path: AUTH_COOKIE_OPTIONS.path
  });

  return res.json({ ok: true });
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuthUser(req);
  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, isAdmin: true, referralCode: true, createdAt: true }
  });

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  // lazy-generate referralCode for users registered before this feature
  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = await ensureUniqueReferralCode();
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      referralCode,
      createdAt: user.createdAt
    }
  });
}));

export { authRouter };
