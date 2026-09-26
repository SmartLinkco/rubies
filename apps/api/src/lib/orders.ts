import { randomBytes } from "node:crypto";
import type { PaymentMethod, Prisma } from "@prisma/client";
import type { PlaceOrderInput, PlaceOrderResult } from "@rubies/shared";
import { getOrCreateCart } from "./cart.js";
import { quoteDeliveryFee, requireInRange } from "./delivery-fee.js";
import {
  initializePaystackTransaction,
  paystackMockMode,
} from "./paystack.js";
import { prisma } from "./prisma.js";
import { toOrderDto } from "./serialize.js";
import { evaluateAcceptingOrders } from "./hours.js";
import { AppError } from "../middleware/error.js";

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `RC-${stamp}-${suffix}`;
}

function generatePaystackReference(orderNumber: string) {
  return orderNumber.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

async function loadOrder(orderId: string) {
  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getOrderByNumber(orderNumber: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }
  return toOrderDto(order);
}

export async function listOrdersForUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map((order) => toOrderDto(order));
}

export async function placeOrder(opts: {
  userId?: string;
  guestId?: string;
  input: PlaceOrderInput;
}): Promise<PlaceOrderResult> {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    throw new AppError(500, "SETTINGS_MISSING", "Restaurant settings not seeded");
  }

  const hours = evaluateAcceptingOrders(settings);
  if (!hours.isAcceptingOrders) {
    throw new AppError(
      403,
      "RESTAURANT_CLOSED",
      hours.closedReason ?? "We are closed right now",
      { nextOpenLabel: hours.nextOpenLabel },
    );
  }

  const cart = await getOrCreateCart({
    userId: opts.userId,
    guestId: opts.guestId,
  });
  if (cart.items.length === 0) {
    throw new AppError(400, "CART_EMPTY", "Your cart is empty");
  }

  for (const line of cart.items) {
    if (!line.menuItem.available) {
      throw new AppError(
        400,
        "ITEM_UNAVAILABLE",
        `${line.menuItem.name} is no longer available`,
      );
    }
  }

  let deliveryLine1: string;
  let deliveryLandmark: string | null = null;
  let deliveryCity = "Accra";
  let deliveryLat: number | null = null;
  let deliveryLng: number | null = null;
  let addressId: string | null = null;

  if (opts.input.addressId) {
    if (!opts.userId) {
      throw new AppError(401, "UNAUTHORIZED", "Sign in to use a saved address");
    }
    const address = await prisma.address.findFirst({
      where: { id: opts.input.addressId, userId: opts.userId },
    });
    if (!address) {
      throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found");
    }
    addressId = address.id;
    deliveryLine1 = address.line1;
    deliveryLandmark = address.landmark;
    deliveryCity = address.city;
    deliveryLat = address.lat;
    deliveryLng = address.lng;
  } else if (opts.input.delivery?.line1?.trim()) {
    deliveryLine1 = opts.input.delivery.line1.trim();
    deliveryLandmark = opts.input.delivery.landmark?.trim() || null;
    deliveryCity = opts.input.delivery.city?.trim() || "Accra";
    deliveryLat = opts.input.delivery.lat ?? null;
    deliveryLng = opts.input.delivery.lng ?? null;
  } else {
    throw new AppError(400, "ADDRESS_REQUIRED", "Delivery address is required");
  }

  let guestName = opts.input.guestName?.trim() || null;
  let guestPhone = opts.input.guestPhone?.trim() || null;
  let contactEmail: string | null = null;

  if (opts.userId) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: opts.userId } });
    guestName = guestName || user.name;
    guestPhone = guestPhone || user.phone;
    contactEmail = user.email;
    if (!guestPhone) {
      throw new AppError(
        400,
        "PHONE_REQUIRED",
        "Add a phone number to your profile before ordering",
      );
    }
  } else {
    if (!guestName || !guestPhone) {
      throw new AppError(
        400,
        "CONTACT_REQUIRED",
        "Name and phone are required for guest checkout",
      );
    }
  }

  const quote = quoteDeliveryFee(settings, {
    lat: deliveryLat,
    lng: deliveryLng,
  });
  requireInRange(quote);

  // Promo codes wire in Phase 5 — accept field but do not discount yet
  if (opts.input.promoCode?.trim()) {
    // intentionally ignored until offers are live
  }

  const subtotalGhs = cart.items.reduce(
    (sum, line) => sum + Number(line.menuItem.priceGhs) * line.quantity,
    0,
  );
  const discountGhs = 0;
  const deliveryFeeGhs = quote.deliveryFeeGhs;
  const totalGhs = Math.round((subtotalGhs + deliveryFeeGhs - discountGhs) * 100) / 100;

  const paymentMethod = opts.input.paymentMethod as PaymentMethod;
  const orderNumber = generateOrderNumber();
  const paystackRef = generatePaystackReference(orderNumber);

  const order = await prisma.$transaction(
    async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: opts.userId ?? null,
          guestName,
          guestPhone,
          addressId,
          deliveryLine1,
          deliveryLandmark,
          deliveryCity,
          deliveryLat,
          deliveryLng,
          status: "pending_confirmation",
          paymentMethod,
          paymentStatus: "pending",
          subtotalGhs,
          deliveryFeeGhs,
          discountGhs,
          totalGhs,
          notes: opts.input.notes?.trim() || null,
          items: {
            create: cart.items.map((line) => ({
              menuItemId: line.menuItemId,
              name: line.menuItem.name,
              unitPriceGhs: line.menuItem.priceGhs,
              quantity: line.quantity,
            })),
          },
          statusEvents: {
            create: {
              status: "pending_confirmation",
              note: "Order placed",
            },
          },
          payment: {
            create: {
              method: paymentMethod,
              status: "pending",
              provider: paymentMethod === "paystack" ? "paystack" : null,
              providerRef: paymentMethod === "paystack" ? paystackRef : null,
              amountGhs: totalGhs,
            },
          },
        },
        include: {
          items: true,
          statusEvents: { orderBy: { createdAt: "asc" } },
        },
      });

      return created;
    },
    { timeout: 20000 },
  );

  // Clear cart outside the order write so Neon latency does not abort placement
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  let authorizationUrl: string | null = null;

  if (paymentMethod === "paystack") {
    const webOrigin =
      process.env.WEB_ORIGIN?.split(",")[0]?.trim() ?? "http://localhost:3000";
    const email =
      contactEmail ||
      `${(guestPhone ?? "guest").replace(/\D/g, "")}@orders.rubiescuisine.local`;

    const init = await initializePaystackTransaction({
      email,
      amountGhs: totalGhs,
      reference: paystackRef,
      callbackUrl: `${webOrigin}/orders/${order.orderNumber}?paid=1`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    authorizationUrl = init.authorizationUrl;

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        providerRef: init.reference,
        raw: {
          accessCode: init.accessCode,
          mock: paystackMockMode(),
        } satisfies Prisma.InputJsonValue,
      },
    });
  }

  return {
    order: toOrderDto(await loadOrder(order.id), {
      paystackAuthorizationUrl: authorizationUrl,
    }),
    authorizationUrl,
  };
}

export async function markOrderPaidByReference(
  reference: string,
  raw?: unknown,
) {
  const payment = await prisma.payment.findFirst({
    where: { providerRef: reference },
    include: { order: true },
  });

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (payment.status === "paid") {
    return loadOrder(payment.orderId);
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        raw: (raw ?? payment.raw) as Prisma.InputJsonValue,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "paid" },
    }),
  ]);

  return loadOrder(payment.orderId);
}

export { loadOrder };
