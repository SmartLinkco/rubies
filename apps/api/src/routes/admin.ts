import { Router } from "express";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import {
  listAllOrders,
  updateOrderStatus,
} from "../lib/orders.js";
import { AppError } from "../middleware/error.js";
import { requireAdmin } from "../middleware/session.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/orders", async (_req, res) => {
  const orders = await listAllOrders(100);
  res.json({ data: orders });
});

const statusSchema = z.object({
  status: z.enum([
    "pending_confirmation",
    "confirmed",
    "preparing",
    "on_the_way",
    "delivered",
    "cancelled",
  ]),
  note: z.string().max(300).optional().nullable(),
  markCodPaid: z.boolean().optional(),
});

adminRouter.patch("/orders/:orderNumber/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid status update", parsed.error.flatten());
  }

  const order = await updateOrderStatus({
    orderNumber: req.params.orderNumber,
    status: parsed.data.status as OrderStatus,
    note: parsed.data.note,
    markCodPaid: parsed.data.markCodPaid,
  });

  res.json({ data: order });
});
