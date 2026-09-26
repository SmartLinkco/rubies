import type { RestaurantSettings } from "@prisma/client";
import type { DeliveryQuoteDto } from "@rubies/shared";
import { AppError } from "../middleware/error.js";

const EARTH_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function quoteDeliveryFee(
  settings: Pick<
    RestaurantSettings,
    | "deliveryFeeMode"
    | "fixedDeliveryFeeGhs"
    | "distanceBaseFeeGhs"
    | "distancePerKmGhs"
    | "maxDeliveryKm"
    | "restaurantLat"
    | "restaurantLng"
  >,
  coords?: { lat: number | null; lng: number | null } | null,
): DeliveryQuoteDto {
  const fixed = Number(settings.fixedDeliveryFeeGhs);

  if (settings.deliveryFeeMode === "fixed") {
    return {
      mode: "fixed",
      deliveryFeeGhs: fixed,
      distanceKm: null,
      withinRange: true,
      maxDeliveryKm: settings.maxDeliveryKm,
      message: null,
    };
  }

  const lat = coords?.lat ?? null;
  const lng = coords?.lng ?? null;

  if (lat == null || lng == null) {
    return {
      mode: "distance",
      deliveryFeeGhs: Number(settings.distanceBaseFeeGhs),
      distanceKm: null,
      withinRange: true,
      maxDeliveryKm: settings.maxDeliveryKm,
      message: "Using base delivery fee until pin is set.",
    };
  }

  const distanceKm = haversineKm(
    settings.restaurantLat,
    settings.restaurantLng,
    lat,
    lng,
  );
  const rounded = Math.round(distanceKm * 10) / 10;
  const withinRange = rounded <= settings.maxDeliveryKm;

  if (!withinRange) {
    return {
      mode: "distance",
      deliveryFeeGhs: 0,
      distanceKm: rounded,
      withinRange: false,
      maxDeliveryKm: settings.maxDeliveryKm,
      message: `Outside delivery range (max ${settings.maxDeliveryKm} km).`,
    };
  }

  const fee =
    Number(settings.distanceBaseFeeGhs) +
    rounded * Number(settings.distancePerKmGhs);

  return {
    mode: "distance",
    deliveryFeeGhs: Math.round(fee * 100) / 100,
    distanceKm: rounded,
    withinRange: true,
    maxDeliveryKm: settings.maxDeliveryKm,
    message: null,
  };
}

export function requireInRange(quote: DeliveryQuoteDto) {
  if (!quote.withinRange) {
    throw new AppError(
      400,
      "OUT_OF_RANGE",
      quote.message ?? "Address is outside our delivery area",
    );
  }
}
