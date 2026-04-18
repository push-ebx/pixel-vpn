import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "./jwt";

export type AuthUser = {
  id: string;
  email: string;
};

export type RequestWithAuth = Request & {
  auth?: AuthUser;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
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
    (req as RequestWithAuth).auth = {
      id: payload.sub,
      email: payload.email
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
