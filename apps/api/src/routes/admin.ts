import { Router } from "express";
import { z } from "zod";
import type { OrderStatus, RestaurantSettings } from "@prisma/client";
import type {
  AdminDashboardDto,
  AdminReviewDto,
  CateringInquiryDto,
  OfferDto,
  RestaurantAdminDto,
} from "@rubies/shared";
import { evaluateAcceptingOrders } from "../lib/hours.js";
import { listAllOrders, updateOrderStatus } from "../lib/orders.js";
import { toOfferDto } from "../lib/offers.js";
import { prisma } from "../lib/prisma.js";
import { toMenuItemDto, toOrderDto } from "../lib/serialize.js";
import {
  createMenuImageUpload,
  getStorageStatus,
  normalizeStoredImageUrl,
  withSignedMenuImage,
} from "../lib/storage.js";
import { AppError } from "../middleware/error.js";
import { requireAdmin } from "../middleware/session.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/storage", (_req, res) => {
  res.json({ data: getStorageStatus() });
});

const uploadSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  filename: z.string().min(1).max(120).optional(),
});

adminRouter.post("/uploads/presign", async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid upload request", parsed.error.flatten());
  }

  const upload = await createMenuImageUpload(parsed.data);
  res.json({ data: upload });
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function toSettingsDto(settings: RestaurantSettings): RestaurantAdminDto {
  const hours = evaluateAcceptingOrders(settings);
  return {
    name: settings.name,
    tagline: settings.tagline,
    phones: settings.phones,
    whatsapp: settings.whatsapp,
    address: settings.address,
    deliveryFeeMode: settings.deliveryFeeMode,
    fixedDeliveryFeeGhs: Number(settings.fixedDeliveryFeeGhs),
    distanceBaseFeeGhs: Number(settings.distanceBaseFeeGhs),
    distancePerKmGhs: Number(settings.distancePerKmGhs),
    maxDeliveryKm: settings.maxDeliveryKm,
    restaurantLat: settings.restaurantLat,
    restaurantLng: settings.restaurantLng,
    closedWeekdays: settings.closedWeekdays,
    forceClosed: settings.forceClosed,
    forceOpen: settings.forceOpen,
    isAcceptingOrders: hours.isAcceptingOrders,
    closedReason: hours.closedReason,
    nextOpenLabel: hours.nextOpenLabel,
    notifySmsOnNewOrder: settings.notifySmsOnNewOrder,
    notifyEmailOnNewOrder: settings.notifyEmailOnNewOrder,
    ownerEmails: settings.ownerEmails,
    ownerPhones: settings.ownerPhones,
  };
}

function toCateringDto(item: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  message: string;
  status: string;
  createdAt: Date;
}): CateringInquiryDto {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email,
    eventDate: item.eventDate?.toISOString() ?? null,
    guestCount: item.guestCount,
    message: item.message,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  };
}

adminRouter.get("/dashboard", async (_req, res) => {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    throw new AppError(500, "SETTINGS_MISSING", "Restaurant settings not seeded");
  }

  const hours = evaluateAcceptingOrders(settings);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const openStatuses: OrderStatus[] = [
    "pending_confirmation",
    "confirmed",
    "preparing",
    "on_the_way",
  ];

  const [openOrderCount, pendingConfirmationCount, deliveredTodayCount, newCateringCount, recent] =
    await Promise.all([
      prisma.order.count({ where: { status: { in: openStatuses } } }),
      prisma.order.count({ where: { status: "pending_confirmation" } }),
      prisma.order.count({
        where: { status: "delivered", updatedAt: { gte: startOfDay } },
      }),
      prisma.cateringInquiry.count({ where: { status: "new" } }),
      listAllOrders(8),
    ]);

  const data: AdminDashboardDto = {
    openOrderCount,
    pendingConfirmationCount,
    deliveredTodayCount,
    newCateringCount,
    isAcceptingOrders: hours.isAcceptingOrders,
    closedReason: hours.closedReason,
    recentOrders: recent,
  };

  res.json({ data });
});

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

adminRouter.patch("/orders/:orderNumber/mark-paid", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { payment: true },
  });
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }
  if (order.paymentMethod !== "cod") {
    throw new AppError(400, "NOT_COD", "Only COD orders can be marked paid here");
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "paid" },
    }),
    prisma.payment.update({
      where: { orderId: order.id },
      data: { status: "paid" },
    }),
  ]);

  const full = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      review: true,
      payment: true,
    },
  });

  res.json({ data: toOrderDto(full) });
});

adminRouter.get("/menu", async (_req, res) => {
  const items = await prisma.menuItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const data = await Promise.all(items.map((item) => withSignedMenuImage(toMenuItemDto(item))));
  res.json({ data });
});

const menuSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().min(4).max(800),
  priceGhs: z.number().positive().max(5000),
  imageUrl: z.string().min(1).optional().nullable().or(z.literal("")),
  category: z.string().min(2).max(40).default("Meals"),
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

adminRouter.post("/menu", async (req, res) => {
  const parsed = menuSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid menu item", parsed.error.flatten());
  }

  let slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
  if (!slug) slug = `item-${Date.now()}`;

  const existing = await prisma.menuItem.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const item = await prisma.menuItem.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description.trim(),
      priceGhs: parsed.data.priceGhs,
      imageUrl: normalizeStoredImageUrl(parsed.data.imageUrl),
      category: parsed.data.category,
      available: parsed.data.available ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  res.status(201).json({ data: await withSignedMenuImage(toMenuItemDto(item)) });
});

adminRouter.patch("/menu/:id", async (req, res) => {
  const parsed = menuSchema.partial().safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid menu update", parsed.error.flatten());
  }

  const existing = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");
  }

  let slug = parsed.data.slug?.trim();
  if (slug && slug !== existing.slug) {
    const clash = await prisma.menuItem.findUnique({ where: { slug } });
    if (clash) {
      throw new AppError(400, "SLUG_TAKEN", "That slug is already in use");
    }
  } else if (parsed.data.name && !parsed.data.slug) {
    slug = undefined;
  }

  const item = await prisma.menuItem.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(slug ? { slug } : {}),
      ...(parsed.data.description != null
        ? { description: parsed.data.description.trim() }
        : {}),
      ...(parsed.data.priceGhs != null ? { priceGhs: parsed.data.priceGhs } : {}),
      ...(parsed.data.imageUrl !== undefined
        ? { imageUrl: normalizeStoredImageUrl(parsed.data.imageUrl) }
        : {}),
      ...(parsed.data.category != null ? { category: parsed.data.category } : {}),
      ...(parsed.data.available != null ? { available: parsed.data.available } : {}),
      ...(parsed.data.sortOrder != null ? { sortOrder: parsed.data.sortOrder } : {}),
    },
  });

  res.json({ data: await withSignedMenuImage(toMenuItemDto(item)) });
});

adminRouter.delete("/menu/:id", async (req, res) => {
  const existing = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { orderItems: true, cartItems: true } } },
  });
  if (!existing) {
    throw new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");
  }

  if (existing._count.orderItems > 0 || existing._count.cartItems > 0) {
    const item = await prisma.menuItem.update({
      where: { id: existing.id },
      data: { available: false },
    });
    res.json({ data: await withSignedMenuImage(toMenuItemDto(item)), softDeleted: true });
    return;
  }

  await prisma.menuItem.delete({ where: { id: existing.id } });
  res.json({ data: { ok: true }, softDeleted: false });
});

adminRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    throw new AppError(500, "SETTINGS_MISSING", "Restaurant settings not seeded");
  }
  res.json({ data: toSettingsDto(settings) });
});

const settingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  tagline: z.string().min(2).max(120).optional(),
  phones: z.array(z.string().min(7).max(20)).min(1).max(5).optional(),
  whatsapp: z.string().min(7).max(20).optional(),
  address: z.string().min(4).max(200).optional(),
  deliveryFeeMode: z.enum(["fixed", "distance"]).optional(),
  fixedDeliveryFeeGhs: z.number().min(0).max(500).optional(),
  distanceBaseFeeGhs: z.number().min(0).max(500).optional(),
  distancePerKmGhs: z.number().min(0).max(100).optional(),
  maxDeliveryKm: z.number().min(1).max(100).optional(),
  restaurantLat: z.number().min(-90).max(90).optional(),
  restaurantLng: z.number().min(-180).max(180).optional(),
  closedWeekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  forceClosed: z.boolean().optional(),
  forceOpen: z.boolean().optional(),
  notifySmsOnNewOrder: z.boolean().optional(),
  notifyEmailOnNewOrder: z.boolean().optional(),
  ownerEmails: z.array(z.string().email()).max(10).optional(),
  ownerPhones: z.array(z.string().min(7).max(20)).max(10).optional(),
});

adminRouter.patch("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid settings", parsed.error.flatten());
  }

  const data = parsed.data;
  if (data.forceOpen && data.forceClosed) {
    throw new AppError(400, "INVALID_OVERRIDE", "Cannot force open and force closed together");
  }

  const settings = await prisma.restaurantSettings.update({
    where: { id: "default" },
    data: {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(data.tagline != null ? { tagline: data.tagline.trim() } : {}),
      ...(data.phones != null ? { phones: data.phones } : {}),
      ...(data.whatsapp != null ? { whatsapp: data.whatsapp.trim() } : {}),
      ...(data.address != null ? { address: data.address.trim() } : {}),
      ...(data.deliveryFeeMode != null ? { deliveryFeeMode: data.deliveryFeeMode } : {}),
      ...(data.fixedDeliveryFeeGhs != null
        ? { fixedDeliveryFeeGhs: data.fixedDeliveryFeeGhs }
        : {}),
      ...(data.distanceBaseFeeGhs != null
        ? { distanceBaseFeeGhs: data.distanceBaseFeeGhs }
        : {}),
      ...(data.distancePerKmGhs != null ? { distancePerKmGhs: data.distancePerKmGhs } : {}),
      ...(data.maxDeliveryKm != null ? { maxDeliveryKm: data.maxDeliveryKm } : {}),
      ...(data.restaurantLat != null ? { restaurantLat: data.restaurantLat } : {}),
      ...(data.restaurantLng != null ? { restaurantLng: data.restaurantLng } : {}),
      ...(data.closedWeekdays != null ? { closedWeekdays: data.closedWeekdays } : {}),
      ...(data.forceClosed != null ? { forceClosed: data.forceClosed } : {}),
      ...(data.forceOpen != null ? { forceOpen: data.forceOpen } : {}),
      ...(data.notifySmsOnNewOrder != null
        ? { notifySmsOnNewOrder: data.notifySmsOnNewOrder }
        : {}),
      ...(data.notifyEmailOnNewOrder != null
        ? { notifyEmailOnNewOrder: data.notifyEmailOnNewOrder }
        : {}),
      ...(data.ownerEmails != null ? { ownerEmails: data.ownerEmails } : {}),
      ...(data.ownerPhones != null ? { ownerPhones: data.ownerPhones } : {}),
    },
  });

  res.json({ data: toSettingsDto(settings) });
});

adminRouter.get("/offers", async (_req, res) => {
  const offers = await prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ data: offers.map(toOfferDto) satisfies OfferDto[] });
});

const offerSchema = z
  .object({
    code: z.string().min(2).max(40),
    title: z.string().min(2).max(80),
    description: z.string().min(2).max(300),
    percentOff: z.number().int().min(1).max(100).optional().nullable(),
    amountOffGhs: z.number().positive().max(500).optional().nullable(),
    minOrderGhs: z.number().min(0).max(5000).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.percentOff != null || v.amountOffGhs != null, {
    message: "Provide percentOff or amountOffGhs",
  });

adminRouter.post("/offers", async (req, res) => {
  const parsed = offerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid offer", parsed.error.flatten());
  }

  const code = parsed.data.code.trim().toUpperCase();
  const clash = await prisma.offer.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
  });
  if (clash) {
    throw new AppError(400, "CODE_TAKEN", "That promo code already exists");
  }

  const offer = await prisma.offer.create({
    data: {
      code,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      percentOff: parsed.data.percentOff ?? null,
      amountOffGhs: parsed.data.amountOffGhs ?? null,
      minOrderGhs: parsed.data.minOrderGhs ?? 0,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      active: parsed.data.active ?? true,
    },
  });

  if (offer.active) {
    const { notifyPushOfferLive } = await import("../lib/push.js");
    void notifyPushOfferLive({
      id: offer.id,
      code: offer.code,
      title: offer.title,
    }).catch((err) => console.error("[push:offer]", err));
  }

  res.status(201).json({ data: toOfferDto(offer) });
});

adminRouter.patch("/offers/:id", async (req, res) => {
  const parsed = z
    .object({
      code: z.string().min(2).max(40).optional(),
      title: z.string().min(2).max(80).optional(),
      description: z.string().min(2).max(300).optional(),
      percentOff: z.number().int().min(1).max(100).optional().nullable(),
      amountOffGhs: z.number().positive().max(500).optional().nullable(),
      minOrderGhs: z.number().min(0).max(5000).optional(),
      expiresAt: z.string().datetime().optional().nullable(),
      active: z.boolean().optional(),
    })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid offer update", parsed.error.flatten());
  }

  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new AppError(404, "OFFER_NOT_FOUND", "Offer not found");
  }

  if (parsed.data.code) {
    const code = parsed.data.code.trim().toUpperCase();
    const clash = await prisma.offer.findFirst({
      where: {
        id: { not: existing.id },
        code: { equals: code, mode: "insensitive" },
      },
    });
    if (clash) {
      throw new AppError(400, "CODE_TAKEN", "That promo code already exists");
    }
  }

  const offer = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.code != null ? { code: parsed.data.code.trim().toUpperCase() } : {}),
      ...(parsed.data.title != null ? { title: parsed.data.title.trim() } : {}),
      ...(parsed.data.description != null
        ? { description: parsed.data.description.trim() }
        : {}),
      ...(parsed.data.percentOff !== undefined ? { percentOff: parsed.data.percentOff } : {}),
      ...(parsed.data.amountOffGhs !== undefined
        ? { amountOffGhs: parsed.data.amountOffGhs }
        : {}),
      ...(parsed.data.minOrderGhs != null ? { minOrderGhs: parsed.data.minOrderGhs } : {}),
      ...(parsed.data.expiresAt !== undefined
        ? { expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null }
        : {}),
      ...(parsed.data.active != null ? { active: parsed.data.active } : {}),
    },
  });

  if (offer.active && !existing.active) {
    const { notifyPushOfferLive } = await import("../lib/push.js");
    void notifyPushOfferLive({
      id: offer.id,
      code: offer.code,
      title: offer.title,
    }).catch((err) => console.error("[push:offer]", err));
  }

  res.json({ data: toOfferDto(offer) });
});

adminRouter.get("/reviews", async (_req, res) => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { orderNumber: true, guestName: true } } },
  });

  const data: AdminReviewDto[] = reviews.map((review) => ({
    id: review.id,
    orderId: review.orderId,
    orderNumber: review.order.orderNumber,
    rating: review.rating,
    comment: review.comment,
    hidden: review.hidden,
    guestName: review.order.guestName,
    createdAt: review.createdAt.toISOString(),
  }));

  res.json({ data });
});

adminRouter.patch("/reviews/:id", async (req, res) => {
  const parsed = z.object({ hidden: z.boolean() }).safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid review update", parsed.error.flatten());
  }

  const review = await prisma.review.update({
    where: { id: req.params.id },
    data: { hidden: parsed.data.hidden },
    include: { order: { select: { orderNumber: true, guestName: true } } },
  });

  const data: AdminReviewDto = {
    id: review.id,
    orderId: review.orderId,
    orderNumber: review.order.orderNumber,
    rating: review.rating,
    comment: review.comment,
    hidden: review.hidden,
    guestName: review.order.guestName,
    createdAt: review.createdAt.toISOString(),
  };

  res.json({ data });
});

adminRouter.get("/catering", async (_req, res) => {
  const items = await prisma.cateringInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ data: items.map(toCateringDto) });
});

adminRouter.patch("/catering/:id", async (req, res) => {
  const parsed = z
    .object({ status: z.enum(["new", "contacted", "done"]) })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid catering status", parsed.error.flatten());
  }

  const item = await prisma.cateringInquiry.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });

  res.json({ data: toCateringDto(item) });
});
