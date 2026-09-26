import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toAddressDto, toUserDto } from "../lib/serialize.js";
import { AppError } from "../middleware/error.js";
import { requireAuth } from "../middleware/session.js";

export const meRouter = Router();

meRouter.use(requireAuth);

const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  phone: z.string().min(9).max(20).nullable().optional(),
  preferredPayment: z.enum(["cod", "paystack"]).optional(),
});

meRouter.patch("/profile", async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid profile details", parsed.error.flatten());
  }

  const user = await prisma.user.update({
    where: { id: req.authUser!.id },
    data: {
      name: parsed.data.name?.trim(),
      phone:
        parsed.data.phone === undefined
          ? undefined
          : parsed.data.phone?.trim() || null,
      preferredPayment: parsed.data.preferredPayment,
    },
  });

  res.json({ data: { user: toUserDto(user) } });
});

meRouter.get("/addresses", async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.authUser!.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json({ data: addresses.map(toAddressDto) });
});

const addressSchema = z.object({
  label: z.string().min(1).max(40).default("Home"),
  line1: z.string().min(3).max(160),
  landmark: z.string().max(120).optional().nullable(),
  city: z.string().min(2).max(80).default("Accra"),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().optional(),
});

meRouter.post("/addresses", async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid address", parsed.error.flatten());
  }

  const userId = req.authUser!.id;
  const count = await prisma.address.count({ where: { userId } });
  const isDefault = parsed.data.isDefault ?? count === 0;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: parsed.data.label,
      line1: parsed.data.line1.trim(),
      landmark: parsed.data.landmark?.trim() || null,
      city: parsed.data.city.trim(),
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      isDefault,
    },
  });

  res.status(201).json({ data: toAddressDto(address) });
});

meRouter.patch("/addresses/:id", async (req, res) => {
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid address", parsed.error.flatten());
  }

  const existing = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.authUser!.id },
  });
  if (!existing) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.authUser!.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: existing.id },
    data: {
      label: parsed.data.label,
      line1: parsed.data.line1?.trim(),
      landmark:
        parsed.data.landmark === undefined
          ? undefined
          : parsed.data.landmark?.trim() || null,
      city: parsed.data.city?.trim(),
      lat: parsed.data.lat === undefined ? undefined : parsed.data.lat,
      lng: parsed.data.lng === undefined ? undefined : parsed.data.lng,
      isDefault: parsed.data.isDefault,
    },
  });

  res.json({ data: toAddressDto(address) });
});

meRouter.delete("/addresses/:id", async (req, res) => {
  const existing = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.authUser!.id },
  });
  if (!existing) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
  }

  await prisma.address.delete({ where: { id: existing.id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: req.authUser!.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  res.json({ data: { ok: true } });
});
