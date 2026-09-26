import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { z } from "zod";
import { markOrderPaidByReference } from "../lib/orders.js";
import {
  paystackMockMode,
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from "../lib/paystack.js";
import { toOrderDto } from "../lib/serialize.js";
import { AppError } from "../middleware/error.js";

export const paymentsRouter = Router();

export async function paystackWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(
          typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}),
        );

    const signature = req.header("x-paystack-signature") ?? undefined;
    if (!verifyPaystackSignature(rawBody, signature)) {
      throw new AppError(401, "INVALID_SIGNATURE", "Invalid Paystack signature");
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as {
      event?: string;
      data?: { reference?: string; status?: string };
    };

    if (payload.event === "charge.success" && payload.data?.reference) {
      await markOrderPaidByReference(payload.data.reference, payload.data);
    }

    res.json({ data: { received: true } });
  } catch (err) {
    next(err);
  }
}

const completeSchema = z.object({
  reference: z.string().min(4),
});

/** After Paystack redirect (and local mock Paystack). */
paymentsRouter.post("/paystack/complete", async (req, res) => {
  const parsed = completeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Reference required", parsed.error.flatten());
  }

  if (paystackMockMode() && process.env.NODE_ENV === "production") {
    throw new AppError(503, "PAYSTACK_NOT_CONFIGURED", "Paystack is not configured");
  }

  const reference = parsed.data.reference;
  const verified = await verifyPaystackTransaction(reference);

  if (verified.status !== "success") {
    throw new AppError(400, "PAYMENT_FAILED", "Payment was not successful");
  }

  const order = await markOrderPaidByReference(reference, verified.raw);
  res.json({ data: toOrderDto(order) });
});
