import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../middleware/error.js";

const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackConfigured() {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  return Boolean(secret && secret !== "test_mock");
}

export function paystackMockMode() {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  return !secret || secret === "test_mock";
}

type InitializeResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export async function initializePaystackTransaction(input: {
  email: string;
  amountGhs: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeResult> {
  if (paystackMockMode()) {
    const sep = input.callbackUrl.includes("?") ? "&" : "?";
    return {
      authorizationUrl: `${input.callbackUrl}${sep}mockPay=1`,
      accessCode: "mock",
      reference: input.reference,
    };
  }

  const secret = process.env.PAYSTACK_SECRET_KEY!.trim();
  const amountPesewas = Math.round(input.amountGhs * 100);

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: amountPesewas,
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    }),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new AppError(
      502,
      "PAYSTACK_INIT_FAILED",
      json.message ?? "Could not start Paystack payment",
    );
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export function verifyPaystackSignature(rawBody: Buffer, signature: string | undefined) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || secret === "test_mock") {
    return paystackMockMode();
  }
  if (!signature) return false;

  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function verifyPaystackTransaction(reference: string) {
  if (paystackMockMode()) {
    return { status: "success" as const, amountGhs: null as number | null, raw: { mock: true } };
  }

  const secret = process.env.PAYSTACK_SECRET_KEY!.trim();
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
    },
  );
  const json = (await res.json()) as {
    status?: boolean;
    data?: { status: string; amount: number; reference: string };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new AppError(502, "PAYSTACK_VERIFY_FAILED", "Could not verify payment");
  }

  return {
    status: json.data.status,
    amountGhs: json.data.amount / 100,
    raw: json.data,
  };
}
