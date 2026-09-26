import { Router } from "express";
import type { MenuItemDto } from "@rubies/shared";
import { prisma } from "../lib/prisma.js";
import { withSignedMenuImage } from "../lib/storage.js";
import { AppError } from "../middleware/error.js";

export const menuRouter = Router();

menuRouter.get("/", async (_req, res) => {
  const items = await prisma.menuItem.findMany({
    where: { available: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const data: MenuItemDto[] = await Promise.all(
    items.map((item) =>
      withSignedMenuImage({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        priceGhs: Number(item.priceGhs),
        imageUrl: item.imageUrl,
        category: item.category,
        available: item.available,
        sortOrder: item.sortOrder,
      }),
    ),
  );

  res.json({ data });
});

menuRouter.get("/:slug", async (req, res) => {
  const item = await prisma.menuItem.findUnique({
    where: { slug: req.params.slug },
  });

  if (!item || !item.available) {
    throw new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");
  }

  const data = await withSignedMenuImage({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    priceGhs: Number(item.priceGhs),
    imageUrl: item.imageUrl,
    category: item.category,
    available: item.available,
    sortOrder: item.sortOrder,
  });

  res.json({ data });
});
