import { Router } from "express";
import { z } from "zod";
import { getOrCreateCart } from "../lib/cart.js";
import { quoteDeliveryFee } from "../lib/delivery-fee.js";
import {
  listActiveOffers,
  previewPromo,
  toOfferDto,
  getOfferByCode,
} from "../lib/offers.js";
import { prisma } from "../lib/prisma.js";
import { toCartDto } from "../lib/serialize.js";
import { AppError } from "../middleware/error.js";

export const offersRouter = Router();

offersRouter.get("/", async (_req, res) => {
  const offers = await listActiveOffers();
  res.json({ data: offers });
});

offersRouter.get("/:code", async (req, res) => {
  const offer = await getOfferByCode(req.params.code);
  if (!offer.active) {
    throw new AppError(404, "OFFER_NOT_FOUND", "Promo code not found");
  }
  if (offer.expiresAt && offer.expiresAt.getTime() <= Date.now()) {
    throw new AppError(400, "OFFER_EXPIRED", "This promo has expired");
  }
  res.json({ data: toOfferDto(offer) });
});

const previewSchema = z.object({
  code: z.string().min(2).max(40),
  addressId: z.string().min(1).optional(),
  lat: z.number().finite().optional().nullable(),
  lng: z.number().finite().optional().nullable(),
});

offersRouter.post("/preview", async (req, res) => {
  const parsed = previewSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid promo preview", parsed.error.flatten());
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
      throw new AppError(401, "UNAUTHORIZED", "Sign in to use a saved address");
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
  if (cartDto.items.length === 0) {
    throw new AppError(400, "CART_EMPTY", "Add items before applying a promo");
  }

  const quote = quoteDeliveryFee(settings, { lat, lng });
  const deliveryFeeGhs = quote.withinRange ? quote.deliveryFeeGhs : 0;
  const preview = await previewPromo({
    code: parsed.data.code,
    subtotalGhs: cartDto.subtotalGhs,
    deliveryFeeGhs,
  });

  res.json({ data: { ...preview, quote } });
});
