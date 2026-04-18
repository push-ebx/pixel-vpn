import type { NextFunction, Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "./jwt";

export type AuthUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export type RequestWithAuth = Request & {
  auth?: AuthUser;
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;

  if (!token) {
    token = req.cookies?.["pixel-vpn-web-auth-token"];
  }

  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isAdmin: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    (req as RequestWithAuth).auth = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Недействительный токен" });
  }
}

export function getAuthUser(req: Request): AuthUser {
  const user = (req as RequestWithAuth).auth;

  if (!user) {
    throw new Error("Отсутствует авторизованный пользователь в контексте запроса");
  }

  return user;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = (req as RequestWithAuth).auth;

  if (!auth || !auth.isAdmin) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }

  return next();
}
