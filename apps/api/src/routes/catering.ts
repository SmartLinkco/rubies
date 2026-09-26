import { Router } from "express";
import { z } from "zod";
import { notifyCateringInquiry } from "../lib/notify.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";
import { requireAdmin } from "../middleware/session.js";

export const cateringRouter = Router();

const inquirySchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(9).max(20),
  email: z.string().email().optional().nullable(),
  eventDate: z.string().datetime().optional().nullable(),
  guestCount: z.number().int().min(1).max(5000).optional().nullable(),
  message: z.string().min(10).max(2000),
  kind: z.enum(["catering", "event-space"]).optional(),
});

cateringRouter.post("/", async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid inquiry", parsed.error.flatten());
  }

  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });

  const inquiry = await prisma.cateringInquiry.create({
    data: {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      email: parsed.data.email?.trim() || null,
      eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
      guestCount: parsed.data.guestCount ?? null,
      message: parsed.data.message.trim(),
      status: "new",
    },
  });

  const ownerPhones = settings?.ownerPhones?.length
    ? settings.ownerPhones
    : ["0277491795"];
  const ownerEmails = settings?.ownerEmails?.length
    ? settings.ownerEmails
    : [];

  if (ownerEmails.length || ownerPhones.length) {
    await notifyCateringInquiry(
      {
        name: inquiry.name,
        phone: inquiry.phone,
        email: inquiry.email,
        eventDate: inquiry.eventDate,
        guestCount: inquiry.guestCount,
        message: inquiry.message,
        kind: parsed.data.kind ?? "catering",
      },
      { ownerPhones, ownerEmails },
    );
  }

  res.status(201).json({
    data: {
      id: inquiry.id,
      status: inquiry.status,
      message: "Thanks! Rubies Cuisine will contact you shortly.",
    },
  });
});

cateringRouter.get("/inbox", requireAdmin, async (_req, res) => {
  const items = await prisma.cateringInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({
    data: items.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      eventDate: item.eventDate?.toISOString() ?? null,
      guestCount: item.guestCount,
      message: item.message,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
  });
});
