import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { isEmailConfigured, sendEmail } from "./notify.js";
import {
  otpEmailHtml,
  otpEmailSubject,
  otpEmailText,
} from "./email-templates.js";
import { AppError } from "../middleware/error.js";

export type OtpPurpose = "signup" | "reset";

export type SignupPayload = {
  passwordHash: string;
  name: string | null;
  phone: string | null;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45 * 1000;

function hashCode(email: string, purpose: OtpPurpose, code: string) {
  return createHash("sha256")
    .update(`${email}:${purpose}:${code}`)
    .digest("hex");
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function otpMinutes() {
  return Math.round(OTP_TTL_MS / 60_000);
}

export async function issueEmailOtp(input: {
  email: string;
  purpose: OtpPurpose;
  payload?: SignupPayload | null;
}) {
  const email = input.email.toLowerCase().trim();
  const latest = await prisma.emailOtpChallenge.findFirst({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    throw new AppError(
      429,
      "OTP_COOLDOWN",
      "Please wait a moment before requesting another code",
    );
  }

  // Invalidate prior open challenges for this email+purpose
  await prisma.emailOtpChallenge.updateMany({
    where: { email, purpose: input.purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const challenge = await prisma.emailOtpChallenge.create({
    data: {
      email,
      purpose: input.purpose,
      codeHash: hashCode(email, input.purpose, code),
      payloadJson: input.payload ?? undefined,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const sent = await sendEmail({
    to: email,
    subject: otpEmailSubject(input.purpose),
    body: otpEmailText({
      code,
      purpose: input.purpose,
      minutes: otpMinutes(),
    }),
    html: otpEmailHtml({
      code,
      purpose: input.purpose,
      minutes: otpMinutes(),
    }),
  });

  if (!sent.ok) {
    throw new AppError(
      502,
      "OTP_EMAIL_FAILED",
      "Could not send verification email. Try again shortly.",
    );
  }

  return {
    challengeId: challenge.id,
    email,
    expiresInSec: Math.round(OTP_TTL_MS / 1000),
    /** Only when Resend isn't configured — for local/dev testing. */
    devCode: isEmailConfigured() ? undefined : code,
  };
}

export async function consumeEmailOtp(input: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}) {
  const email = input.email.toLowerCase().trim();
  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new AppError(400, "INVALID_OTP", "Enter the 6-digit code from your email");
  }

  const challenge = await prisma.emailOtpChallenge.findFirst({
    where: {
      email,
      purpose: input.purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw new AppError(400, "OTP_NOT_FOUND", "No active code. Request a new one.");
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    throw new AppError(400, "OTP_EXPIRED", "That code has expired. Request a new one.");
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    throw new AppError(400, "OTP_LOCKED", "Too many attempts. Request a new code.");
  }

  const expected = hashCode(email, input.purpose, code);
  const ok = expected === challenge.codeHash;
  if (!ok) {
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError(400, "INVALID_OTP", "Incorrect code. Check your email and try again.");
  }

  await prisma.emailOtpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  return challenge;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
