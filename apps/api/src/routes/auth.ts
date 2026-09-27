import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from "../lib/auth.js";
import { mergeGuestCartIntoUser, toCartDto } from "../lib/cart.js";
import {
  consumeEmailOtp,
  hashPassword,
  issueEmailOtp,
  type SignupPayload,
} from "../lib/email-otp.js";
import { prisma } from "../lib/prisma.js";
import { toUserDto } from "../lib/serialize.js";
import { AppError } from "../middleware/error.js";
import { requireAuth } from "../middleware/session.js";

export const authRouter = Router();

const registerStartSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80).optional(),
  phone: z.string().min(9).max(20).optional(),
});

const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

/** Step 1 — create signup OTP (does not create the user yet). */
authRouter.post("/register/start", async (req, res) => {
  const parsed = registerStartSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid registration details", parsed.error.flatten());
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }

  const phone = parsed.data.phone?.trim() || null;
  if (phone) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone, NOT: { email } },
    });
    if (phoneTaken) {
      throw new AppError(409, "PHONE_IN_USE", "That phone number is already registered");
    }
  }

  const payload: SignupPayload = {
    passwordHash: await hashPassword(parsed.data.password),
    name: parsed.data.name?.trim() || null,
    phone,
  };

  const issued = await issueEmailOtp({
    email,
    purpose: "signup",
    payload,
  });

  res.json({
    data: {
      email: issued.email,
      expiresInSec: issued.expiresInSec,
      ...(issued.devCode ? { devCode: issued.devCode } : {}),
    },
  });
});

/** Resend signup OTP (reuses pending payload). */
authRouter.post("/register/resend", async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Email required");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }

  const prior = await prisma.emailOtpChallenge.findFirst({
    where: { email, purpose: "signup" },
    orderBy: { createdAt: "desc" },
  });
  if (!prior?.payloadJson) {
    throw new AppError(400, "OTP_NOT_FOUND", "Start registration again");
  }

  const payload = prior.payloadJson as SignupPayload;
  const issued = await issueEmailOtp({ email, purpose: "signup", payload });

  res.json({
    data: {
      email: issued.email,
      expiresInSec: issued.expiresInSec,
      ...(issued.devCode ? { devCode: issued.devCode } : {}),
    },
  });
});

/** Step 2 — verify OTP and create the account. */
authRouter.post("/register/verify", async (req, res) => {
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid verification details");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }

  const challenge = await consumeEmailOtp({
    email,
    purpose: "signup",
    code: parsed.data.code,
  });

  const payload = challenge.payloadJson as SignupPayload | null;
  if (!payload?.passwordHash) {
    throw new AppError(400, "OTP_NOT_FOUND", "Start registration again");
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: payload.passwordHash,
      name: payload.name,
      phone: payload.phone,
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

/** Legacy direct register — blocked in favour of OTP flow. */
authRouter.post("/register", async (_req, res) => {
  throw new AppError(
    400,
    "OTP_REQUIRED",
    "Use email verification to create an account",
  );
});

authRouter.post("/login", async (req, res) => {
  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
    })
    .safeParse(req.body);
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

/** Forgot password — always OK response (no email enumeration). */
authRouter.post("/password/forgot", async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Enter a valid email");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  let devCode: string | undefined;
  if (user?.passwordHash) {
    try {
      const issued = await issueEmailOtp({ email, purpose: "reset" });
      devCode = issued.devCode;
    } catch (err) {
      if (err instanceof AppError && err.code === "OTP_COOLDOWN") {
        // Still return generic success during cooldown
      } else {
        throw err;
      }
    }
  }

  res.json({
    data: {
      ok: true,
      email,
      message: "If that email is registered, we sent a reset code.",
      ...(devCode ? { devCode } : {}),
    },
  });
});

authRouter.post("/password/reset", async (req, res) => {
  const parsed = z
    .object({
      email: z.string().email(),
      code: z.string().min(4).max(8),
      password: z.string().min(8).max(72),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid reset details");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(400, "INVALID_OTP", "Incorrect code or email");
  }

  await consumeEmailOtp({
    email,
    purpose: "reset",
    code: parsed.data.code,
  });

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  res.json({ data: { ok: true } });
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
