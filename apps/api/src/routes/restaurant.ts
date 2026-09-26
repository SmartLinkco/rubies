import { Router } from "express";
import type { RestaurantPublicDto } from "@rubies/shared";
import { prisma } from "../lib/prisma.js";
import { evaluateAcceptingOrders } from "../lib/hours.js";
import { AppError } from "../middleware/error.js";

export const restaurantRouter = Router();

restaurantRouter.get("/", async (_req, res) => {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    throw new AppError(500, "SETTINGS_MISSING", "Restaurant settings not seeded");
  }

  const hours = evaluateAcceptingOrders(settings);

  const data: RestaurantPublicDto = {
    name: settings.name,
    tagline: settings.tagline,
    phones: settings.phones,
    whatsapp: settings.whatsapp,
    address: settings.address,
    isAcceptingOrders: hours.isAcceptingOrders,
    closedReason: hours.closedReason,
    nextOpenLabel: hours.nextOpenLabel,
    deliveryFeeMode: settings.deliveryFeeMode,
    fixedDeliveryFeeGhs: Number(settings.fixedDeliveryFeeGhs),
  };

  res.json({ data });
});
