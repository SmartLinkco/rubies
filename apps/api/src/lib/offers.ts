import type { Offer } from "@prisma/client";
import type { OfferDto, PromoPreviewDto } from "@rubies/shared";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/error.js";

export function toOfferDto(offer: Offer): OfferDto {
  return {
    id: offer.id,
    code: offer.code,
    title: offer.title,
    description: offer.description,
    percentOff: offer.percentOff,
    amountOffGhs: offer.amountOffGhs != null ? Number(offer.amountOffGhs) : null,
    minOrderGhs: Number(offer.minOrderGhs),
    expiresAt: offer.expiresAt?.toISOString() ?? null,
    active: offer.active,
  };
}

export async function listActiveOffers() {
  const now = new Date();
  const offers = await prisma.offer.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return offers.map(toOfferDto);
}

export async function getOfferByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const offer = await prisma.offer.findFirst({
    where: { code: { equals: normalized, mode: "insensitive" } },
  });
  if (!offer) {
    throw new AppError(404, "OFFER_NOT_FOUND", "Promo code not found");
  }
  return offer;
}

export function computeDiscountGhs(offer: Offer, subtotalGhs: number) {
  if (offer.percentOff != null && offer.percentOff > 0) {
    return Math.round(((subtotalGhs * offer.percentOff) / 100) * 100) / 100;
  }
  if (offer.amountOffGhs != null) {
    return Math.min(subtotalGhs, Number(offer.amountOffGhs));
  }
  return 0;
}

export function assertOfferRedeemable(offer: Offer, subtotalGhs: number) {
  if (!offer.active) {
    throw new AppError(400, "OFFER_INACTIVE", "This promo is no longer active");
  }
  if (offer.expiresAt && offer.expiresAt.getTime() <= Date.now()) {
    throw new AppError(400, "OFFER_EXPIRED", "This promo has expired");
  }
  const minOrder = Number(offer.minOrderGhs);
  if (subtotalGhs < minOrder) {
    throw new AppError(
      400,
      "MIN_ORDER",
      `Minimum order for this promo is GHS ${minOrder}`,
      { minOrderGhs: minOrder },
    );
  }
}

export async function previewPromo(opts: {
  code: string;
  subtotalGhs: number;
  deliveryFeeGhs: number;
}): Promise<PromoPreviewDto> {
  const offer = await getOfferByCode(opts.code);
  assertOfferRedeemable(offer, opts.subtotalGhs);
  const discountGhs = computeDiscountGhs(offer, opts.subtotalGhs);
  const totalGhs =
    Math.round((opts.subtotalGhs + opts.deliveryFeeGhs - discountGhs) * 100) / 100;

  return {
    code: offer.code,
    title: offer.title,
    discountGhs,
    subtotalGhs: opts.subtotalGhs,
    deliveryFeeGhs: opts.deliveryFeeGhs,
    totalGhs: Math.max(0, totalGhs),
    message: null,
  };
}

export async function resolveOfferForCheckout(opts: {
  code?: string | null;
  subtotalGhs: number;
}) {
  const raw = opts.code?.trim();
  if (!raw) {
    return { offer: null as Offer | null, discountGhs: 0 };
  }
  const offer = await getOfferByCode(raw);
  assertOfferRedeemable(offer, opts.subtotalGhs);
  const discountGhs = computeDiscountGhs(offer, opts.subtotalGhs);
  return { offer, discountGhs };
}
