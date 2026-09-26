import { Router } from "express";
import { z } from "zod";
import { AppError } from "../middleware/error.js";
import { requireAdmin } from "../middleware/session.js";
import {
  deletePushSubscription,
  getVapidPublicKey,
  isPushConfigured,
  notifyPushFeaturedDish,
  runScheduledPushReminders,
  sendPushToAll,
  upsertPushSubscription,
} from "../lib/push.js";
import { prisma } from "../lib/prisma.js";

export const pushRouter = Router();

pushRouter.get("/vapid-public-key", (_req, res) => {
  const key = getVapidPublicKey();
  res.json({
    data: {
      publicKey: key,
      configured: isPushConfigured(),
    },
  });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(8),
  }),
});

pushRouter.post("/subscribe", async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid subscription", parsed.error.flatten());
  }

  const sub = await upsertPushSubscription({
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    userId: req.authUser?.id ?? null,
    guestId: req.guestId ?? null,
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
  });

  res.status(201).json({
    data: {
      id: sub.id,
      endpoint: sub.endpoint,
    },
  });
});

pushRouter.post("/unsubscribe", async (req, res) => {
  const parsed = z
    .object({ endpoint: z.string().url() })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid endpoint");
  }
  await deletePushSubscription(parsed.data.endpoint);
  res.json({ data: { ok: true } });
});

pushRouter.get("/status", async (req, res) => {
  const endpoint =
    typeof req.query.endpoint === "string" ? req.query.endpoint : null;
  let subscribed = false;
  if (endpoint) {
    const row = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });
    subscribed = Boolean(row);
  } else if (req.authUser?.id || req.guestId) {
    const row = await prisma.pushSubscription.findFirst({
      where: {
        OR: [
          ...(req.authUser?.id ? [{ userId: req.authUser.id }] : []),
          ...(req.guestId ? [{ guestId: req.guestId }] : []),
        ],
      },
    });
    subscribed = Boolean(row);
  }

  res.json({
    data: {
      configured: isPushConfigured(),
      subscribed,
      permissionHint: "Ask the browser for Notification permission, then subscribe.",
    },
  });
});

/** Render Cron / external scheduler — Authorization: Bearer CRON_SECRET */
pushRouter.post("/cron", async (req, res) => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    throw new AppError(503, "CRON_NOT_CONFIGURED", "CRON_SECRET is not set");
  }
  const auth = req.headers.authorization ?? "";
  if (auth !== `Bearer ${secret}`) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid cron secret");
  }

  const result = await runScheduledPushReminders();
  res.json({ data: result });
});

/** Admin test / featured dish nudge */
pushRouter.post("/admin/test", requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      title: z.string().min(2).max(80).optional(),
      body: z.string().min(2).max(200).optional(),
      url: z.string().min(1).max(200).optional(),
    })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid test payload");
  }

  const result = await sendPushToAll({
    title: parsed.data.title ?? "Rubies Cuisine",
    body: parsed.data.body ?? "Are you hungry? Don't wait!",
    url: parsed.data.url ?? "/menu",
    tag: "rubies-test",
  });
  res.json({ data: result });
});

pushRouter.post("/admin/feature-dish", requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      slug: z.string().min(1),
      name: z.string().min(1).optional(),
    })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "slug required");
  }

  const item = await prisma.menuItem.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Menu item not found");
  }

  const result = await notifyPushFeaturedDish({
    slug: item.slug,
    name: parsed.data.name?.trim() || item.name,
  });
  res.json({ data: result });
});
