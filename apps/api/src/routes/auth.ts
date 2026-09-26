import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from "../lib/auth.js";
import { mergeGuestCartIntoUser, toCartDto } from "../lib/cart.js";
import { prisma } from "../lib/prisma.js";
import { toUserDto } from "../lib/serialize.js";
import { AppError } from "../middleware/error.js";
import { requireAuth } from "../middleware/session.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80).optional(),
  phone: z.string().min(9).max(20).optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid registration details", parsed.error.flatten());
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      role: "customer",
      isGuest: false,
    },
  });

  if (req.guestId) {
    await mergeGuestCartIntoUser(req.guestId, user.id);
  }

  const token = await signSessionToken({ id: user.id, role: user.role });
  setSessionCookie(res, token);

  res.status(201).json({ data: { user: toUserDto(user) } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid login details", parsed.error.flatten());
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || user.passwordHash === "$pending$") {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  let cart = null;
  if (req.guestId) {
    cart = toCartDto(await mergeGuestCartIntoUser(req.guestId, user.id));
  }

  const token = await signSessionToken({ id: user.id, role: user.role });
  setSessionCookie(res, token);

  res.json({ data: { user: toUserDto(user), cart } });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ data: { ok: true } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Sign in required");
  }
  res.json({ data: { user: toUserDto(user) } });
});
