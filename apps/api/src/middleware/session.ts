import type { NextFunction, Request, Response } from "express";
import {
  SESSION_COOKIE,
  ensureGuestId,
  verifySessionToken,
} from "../lib/auth.js";
import { AppError } from "./error.js";

export async function attachSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ensureGuestId(req, res);
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (token) {
      const user = await verifySessionToken(token);
      if (user) req.authUser = user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.authUser) {
    next(new AppError(401, "UNAUTHORIZED", "Sign in required"));
    return;
  }
  next();
}
