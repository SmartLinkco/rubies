import { Router } from "express";
import { z } from "zod";
import type { PlaceOrderInput } from "@rubies/shared";
import { getOrCreateCart } from "../lib/cart.js";
import { quoteDeliveryFee } from "../lib/delivery-fee.js";
import {
  getOrderByNumber,
  listOrdersForUser,
  placeOrder,
} from "../lib/orders.js";
import { prisma } from "../lib/prisma.js";
import { toCartDto } from "../lib/serialize.js";
import { AppError } from "../middleware/error.js";
import { requireAuth } from "../middleware/session.js";

export const ordersRouter = Router();

const deliverySchema = z.object({
  line1: z.string().min(3).max(200),
  landmark: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional(),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
});

const placeSchema = z.object({
  paymentMethod: z.enum(["cod", "paystack"]),
  addressId: z.string().min(1).optional(),
  delivery: deliverySchema.optional(),
  guestName: z.string().min(2).max(80).optional(),
  guestPhone: z.string().min(9).max(20).optional(),
  notes: z.string().max(500).optional().nullable(),
  promoCode: z.string().max(40).optional().nullable(),
});

const quoteSchema = z.object({
  addressId: z.string().min(1).optional(),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
});

ordersRouter.post("/quote", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid quote request", parsed.error.flatten());
  }

  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    throw new AppError(500, "SETTINGS_MISSING", "Restaurant settings not seeded");
  }

  let lat = parsed.data.lat ?? null;
  let lng = parsed.data.lng ?? null;

  if (parsed.data.addressId) {
    if (!req.authUser) {
      throw new AppError(401, "UNAUTHORIZED", "Sign in to quote a saved address");
    }
    const address = await prisma.address.findFirst({
      where: { id: parsed.data.addressId, userId: req.authUser.id },
    });
    if (!address) {
      throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
    }
    lat = address.lat;
    lng = address.lng;
  }

  const cart = await getOrCreateCart({
    userId: req.authUser?.id,
    guestId: req.guestId,
  });
  const cartDto = toCartDto(cart);
  const quote = quoteDeliveryFee(settings, { lat, lng });
  const totalGhs = quote.withinRange
    ? Math.round((cartDto.subtotalGhs + quote.deliveryFeeGhs) * 100) / 100
    : cartDto.subtotalGhs;

  res.json({
    data: {
      quote,
      subtotalGhs: cartDto.subtotalGhs,
      totalGhs,
    },
  });
});

ordersRouter.post("/", async (req, res) => {
  const parsed = placeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid order", parsed.error.flatten());
  }

  const input = parsed.data as PlaceOrderInput;
  const result = await placeOrder({
    userId: req.authUser?.id,
    guestId: req.guestId,
    input,
  });

  res.status(201).json({ data: result });
});

ordersRouter.get("/mine", requireAuth, async (req, res) => {
  const orders = await listOrdersForUser(req.authUser!.id);
  res.json({ data: orders });
});

ordersRouter.get("/:orderNumber", async (req, res) => {
  const order = await getOrderByNumber(req.params.orderNumber);
  res.json({ data: order });
});
