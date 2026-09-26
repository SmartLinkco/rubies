import { prisma } from "./prisma.js";
import { toCartDto } from "./serialize.js";
import { AppError } from "../middleware/error.js";

async function loadCart(cartId: string) {
  return prisma.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: {
      items: {
        include: { menuItem: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getOrCreateCart(opts: {
  userId?: string;
  guestId?: string;
}) {
  if (opts.userId) {
    const existing = await prisma.cart.findUnique({
      where: { userId: opts.userId },
      include: {
        items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId: opts.userId },
      include: {
        items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  if (!opts.guestId) {
    throw new AppError(400, "GUEST_REQUIRED", "Guest session missing");
  }

  const existing = await prisma.cart.findUnique({
    where: { guestId: opts.guestId },
    include: {
      items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { guestId: opts.guestId },
    include: {
      items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function mergeGuestCartIntoUser(guestId: string, userId: string) {
  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });

  const userCart = await getOrCreateCart({ userId });

  if (!guestCart || guestCart.items.length === 0) {
    return loadCart(userCart.id);
  }

  for (const item of guestCart.items) {
    const existing = userCart.items.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        },
      });
    }
  }

  await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
  await prisma.cart.delete({ where: { id: guestCart.id } });

  return loadCart(userCart.id);
}

export async function upsertCartItem(
  cartId: string,
  menuItemId: string,
  quantity: number,
) {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, available: true },
  });
  if (!menuItem) {
    throw new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");
  }

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { cartId, menuItemId },
    });
  } else {
    await prisma.cartItem.upsert({
      where: { cartId_menuItemId: { cartId, menuItemId } },
      create: { cartId, menuItemId, quantity },
      update: { quantity },
    });
  }

  return loadCart(cartId);
}

export async function replaceCartItems(
  cartId: string,
  items: { menuItemId: string; quantity: number }[],
) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: item.menuItemId, available: true },
    });
    if (!menuItem) continue;
    await prisma.cartItem.create({
      data: {
        cartId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      },
    });
  }
  return loadCart(cartId);
}

export { toCartDto, loadCart };
