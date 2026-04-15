import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

import { config } from "../config";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(payload: AuthTokenPayload) {
  const signOptions: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    ...signOptions
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
}
