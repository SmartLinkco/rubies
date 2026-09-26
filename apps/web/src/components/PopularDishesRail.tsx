"use client";

import type { MenuItemDto } from "@rubies/shared";
import Link from "next/link";
import { MenuItemCard } from "@/components/MenuItemCard";

export function PopularDishesRail({
  items,
  canOrder = true,
}: {
  items: MenuItemDto[];
  canOrder?: boolean;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-bold text-ink">Popular dishes</h2>
        <Link href="/menu" className="text-sm font-semibold text-rubies-red">
          See more
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <MenuItemCard
            key={item.id}
            item={item}
            canOrder={canOrder}
            layout="rail"
            style={{ animationDelay: `${120 + i * 60}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
