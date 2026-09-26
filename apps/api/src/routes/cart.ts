import { Router, type Request } from "express";
import { z } from "zod";
import {
  getOrCreateCart,
  replaceCartItems,
  toCartDto,
  upsertCartItem,
} from "../lib/cart.js";
import { AppError } from "../middleware/error.js";

export const cartRouter = Router();

async function resolveCart(req: Request) {
  if (req.authUser) {
    return getOrCreateCart({ userId: req.authUser.id });
  }
  if (!req.guestId) {
    throw new AppError(400, "GUEST_REQUIRED", "Guest session missing");
  }
  return getOrCreateCart({ guestId: req.guestId });
}

cartRouter.get("/", async (req, res) => {
  const cart = await resolveCart(req);
  res.json({ data: toCartDto(cart) });
});

const itemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

cartRouter.put("/items", async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cart item", parsed.error.flatten());
  }
  const cart = await resolveCart(req);
  const updated = await upsertCartItem(
    cart.id,
    parsed.data.menuItemId,
    parsed.data.quantity,
  );
  res.json({ data: toCartDto(updated) });
});

const syncSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1).max(99),
    }),
  ),
});

/** Merge local lines into server cart (additive). Prefer PUT /replace to push local as source of truth. */
cartRouter.post("/sync", async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cart sync", parsed.error.flatten());
  }

  const cart = await resolveCart(req);
  for (const item of parsed.data.items) {
    const existing = cart.items.find((i) => i.menuItemId === item.menuItemId);
    const quantity = (existing?.quantity ?? 0) + item.quantity;
    await upsertCartItem(cart.id, item.menuItemId, quantity);
  }

  const updated = await getOrCreateCart(
    req.authUser
      ? { userId: req.authUser.id }
      : { guestId: req.guestId },
  );
  res.json({ data: toCartDto(updated) });
});

cartRouter.put("/replace", async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cart", parsed.error.flatten());
  }
  const cart = await resolveCart(req);
  const updated = await replaceCartItems(cart.id, parsed.data.items);
  res.json({ data: toCartDto(updated) });
});
