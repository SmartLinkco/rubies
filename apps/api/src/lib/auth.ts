import { createHash, randomUUID } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "rubies_session";
export const GUEST_COOKIE = "rubies_guest";

export type AuthUser = {
  id: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      guestId?: string;
    }
  }
}

function secretKey() {
  const secret = process.env.JWT_SECRET ?? "rubies-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export function cookieBase(): CookieOptions {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  };
}

export async function signSessionToken(user: AuthUser) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || (payload.role !== "customer" && payload.role !== "admin")) {
      return null;
    }
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    ...cookieBase(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieBase());
}

export function ensureGuestId(req: Request, res: Response): string {
  const existing = req.cookies?.[GUEST_COOKIE] as string | undefined;
  if (existing) {
    req.guestId = existing;
    return existing;
  }

  const guestId = createHash("sha256")
    .update(`${randomUUID()}-${Date.now()}`)
    .digest("hex")
    .slice(0, 32);

  res.cookie(GUEST_COOKIE, guestId, {
    ...cookieBase(),
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  req.guestId = guestId;
  return guestId;
}
