import webpush from "web-push";
import { prisma } from "./prisma.js";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function vapidConfigured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim(),
  );
}

export function isPushConfigured() {
  return vapidConfigured();
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function ensureVapid() {
  if (!vapidConfigured()) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!.trim(),
    process.env.VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
}

export async function upsertPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userId?: string | null;
  guestId?: string | null;
  userAgent?: string | null;
}) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userId: input.userId ?? null,
      guestId: input.guestId ?? null,
      userAgent: input.userAgent ?? null,
    },
    update: {
      p256dh: input.p256dh,
      auth: input.auth,
      userId: input.userId ?? undefined,
      guestId: input.guestId ?? undefined,
      userAgent: input.userAgent ?? undefined,
    },
  });
}

export async function deletePushSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function sendPushToAll(payload: PushPayload) {
  if (!vapidConfigured()) {
    console.info("[push:stub]", payload.title, payload.body);
    return { sent: 0, failed: 0, stub: true as const };
  }

  ensureVapid();
  const subs = await prisma.pushSubscription.findMany();
  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/menu",
    tag: payload.tag ?? "rubies",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          {
            TTL: 60 * 60 * 12,
            urgency: "normal",
          },
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        const statusCode =
          typeof err === "object" && err && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          stale.push(sub.endpoint);
        } else {
          console.error("[push:send]", sub.endpoint.slice(0, 48), err);
        }
      }
    }),
  );

  if (stale.length) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: stale } },
    });
  }

  return { sent, failed, stub: false as const };
}

/** Accra-local HH:mm */
export function currentSlotInTimezone(timeZone = "Africa/Accra") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour");
  const minute = get("minute");
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const weekday = get("weekday"); // Mon, Tue, ...
  return {
    hhmm: `${hour}:${minute}`,
    dateKey: `${year}-${month}-${day}`,
    weekday,
  };
}

export async function runScheduledPushReminders() {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings?.pushRemindersEnabled) {
    return { skipped: true as const, reason: "disabled" };
  }

  const tz = settings.pushTimezone || "Africa/Accra";
  const { hhmm, dateKey, weekday } = currentSlotInTimezone(tz);
  const slots = settings.pushReminderSlots?.length
    ? settings.pushReminderSlots
    : ["11:30", "17:30"];

  // Closed Wednesdays — skip lunch/dinner nudges that day
  if (weekday === "Wed") {
    return { skipped: true as const, reason: "closed_wednesday" };
  }

  // Match exact slot or within +2 minutes (cron may drift a minute)
  const matched = slots.find((slot) => {
    if (slot === hhmm) return true;
    const [sh, sm] = slot.split(":").map(Number);
    const [ch, cm] = hhmm.split(":").map(Number);
    if ([sh, sm, ch, cm].some((n) => Number.isNaN(n))) return false;
    const slotMins = sh! * 60 + sm!;
    const nowMins = ch! * 60 + cm!;
    const delta = nowMins - slotMins;
    return delta >= 0 && delta <= 2;
  });
  if (!matched) {
    return { skipped: true as const, reason: "no_slot", hhmm };
  }

  const slotKey = `scheduled:${dateKey}:${matched}`;
  const existing = await prisma.pushSendLog.findUnique({ where: { slotKey } });
  if (existing) {
    return { skipped: true as const, reason: "already_sent", slotKey };
  }

  // Event-based twist: Thursday morning first slot → reopen nudge
  const isThursdayMorning = weekday === "Thu" && matched === slots[0];
  const payload: PushPayload = isThursdayMorning
    ? {
        title: "We're open again",
        body: "Closed Wednesdays are over — order fresh Ghanaian meals today.",
        url: "/menu",
        tag: "rubies-reopen",
      }
    : matched <= "14:00"
      ? {
          title: "Lunch is calling",
          body: "Are you hungry? Don't wait! Browse today's menu.",
          url: "/menu",
          tag: "rubies-lunch",
        }
      : {
          title: "Dinner plans?",
          body: "Jollof, fufu, banku & grilled chicken — order for delivery.",
          url: "/menu",
          tag: "rubies-dinner",
        };

  // Prefer linking to an active offer when available
  const offer = await prisma.offer.findFirst({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (offer && !isThursdayMorning) {
    payload.body = `${offer.title} — tap to view ${offer.code}`;
    payload.url = `/offers/${encodeURIComponent(offer.code)}`;
    payload.tag = `rubies-offer-${offer.code}`;
  }

  const result = await sendPushToAll(payload);
  await prisma.pushSendLog.create({
    data: {
      slotKey,
      kind: "scheduled",
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/menu",
      sentCount: result.sent,
    },
  });

  return { skipped: false as const, slotKey, ...result, payload };
}

export async function notifyPushOfferLive(offer: {
  id: string;
  code: string;
  title: string;
}) {
  const slotKey = `offer:${offer.id}`;
  const existing = await prisma.pushSendLog.findUnique({ where: { slotKey } });
  if (existing) return { skipped: true as const };

  const payload: PushPayload = {
    title: "New offer at Rubies",
    body: `${offer.title} — use ${offer.code}`,
    url: `/offers/${encodeURIComponent(offer.code)}`,
    tag: `rubies-offer-${offer.code}`,
  };

  const result = await sendPushToAll(payload);
  await prisma.pushSendLog.create({
    data: {
      slotKey,
      kind: "offer",
      title: payload.title,
      body: payload.body,
      url: payload.url!,
      sentCount: result.sent,
    },
  });
  return { skipped: false as const, ...result };
}

/** Feature a popular dish in an evening nudge (optional event). */
export async function notifyPushFeaturedDish(dish: {
  slug: string;
  name: string;
}) {
  const dateKey = currentSlotInTimezone().dateKey;
  const slotKey = `dish:${dateKey}:${dish.slug}`;
  const existing = await prisma.pushSendLog.findUnique({ where: { slotKey } });
  if (existing) return { skipped: true as const };

  const payload: PushPayload = {
    title: dish.name,
    body: "Looking good tonight — tap to order.",
    url: `/menu/${encodeURIComponent(dish.slug)}`,
    tag: `rubies-dish-${dish.slug}`,
  };

  const result = await sendPushToAll(payload);
  await prisma.pushSendLog.create({
    data: {
      slotKey,
      kind: "dish",
      title: payload.title,
      body: payload.body,
      url: payload.url!,
      sentCount: result.sent,
    },
  });
  return { skipped: false as const, ...result };
}
