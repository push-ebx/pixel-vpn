import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { getAuthUser, requireAuth } from "../auth/middleware";
import { signAccessToken } from "../auth/jwt";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

const authRouter = Router();
const AUTH_COOKIE_NAME = "pixel-vpn-web-auth-token";
const AUTH_COOKIE_OPTIONS = {
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "lax" as const,
  path: "/"
};

const registerSchema = z.object({
  email: z.string().email().max(191).transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(72)
});

const loginSchema = registerSchema;

authRouter.post("/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Некорректные данные", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "Эта почта уже используется" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash
    }
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
      isAdmin: user.isAdmin
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
      isAdmin: user.isAdmin
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
    select: { id: true, email: true, isAdmin: true, createdAt: true }
  });

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  return res.json({ user });
}));

export { authRouter };
