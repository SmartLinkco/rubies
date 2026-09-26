"use client";

import type { CSSProperties } from "react";
import type { MenuItemDto } from "@rubies/shared";
import Link from "next/link";
import { DishVisual } from "@/components/DishVisual";
import { QuickAddButton } from "@/components/QuickAddButton";
import { formatGhs } from "@/lib/format";

export function MenuItemCard({
  item,
  canOrder = true,
  layout = "grid",
  style,
}: {
  item: MenuItemDto;
  canOrder?: boolean;
  layout?: "grid" | "list" | "rail";
  style?: CSSProperties;
}) {
  if (layout === "list") {
    return (
      <div
        className="relative flex gap-3 overflow-hidden rounded-card bg-white/85 p-3 shadow-soft ring-1 ring-black/[0.04]"
        style={style}
      >
        <Link href={`/menu/${item.slug}`} className="shrink-0">
          <DishVisual
            slug={item.slug}
            imageUrl={item.imageUrl}
            className="h-20 w-20 rounded-soft"
            compact
          />
        </Link>
        <div className="min-w-0 flex-1 pr-10">
          <Link href={`/menu/${item.slug}`} className="block">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-ink">{item.name}</h3>
              <span className="shrink-0 text-sm font-semibold text-rubies-blue">
                {formatGhs(item.priceGhs)}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
          </Link>
        </div>
        <QuickAddButton
          item={item}
          disabled={!canOrder}
          className="absolute bottom-3 right-3"
        />
      </div>
    );
  }

  const widthClass = layout === "rail" ? "w-40 shrink-0" : "";

  return (
    <div
      className={`group relative animate-rise overflow-hidden rounded-card bg-white/90 shadow-soft ring-1 ring-black/[0.04] ${widthClass}`}
      style={style}
    >
      <Link href={`/menu/${item.slug}`} className="block">
        <DishVisual
          slug={item.slug}
          imageUrl={item.imageUrl}
          className={layout === "rail" ? "h-28" : "aspect-[4/3]"}
          compact
        />
        <div className="p-3 pr-11">
          <h3 className="line-clamp-1 text-sm font-semibold text-ink group-hover:text-rubies-red">
            {item.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-rubies-blue">
            {formatGhs(item.priceGhs)}
          </p>
        </div>
      </Link>
      <QuickAddButton
        item={item}
        disabled={!canOrder}
        className="absolute bottom-3 right-3"
      />
    </div>
  );
}
