"use client";

import type { MenuItemDto } from "@rubies/shared";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export function AddToCartButton({
  item,
  disabled = false,
  disabledReason,
}: {
  item: Pick<MenuItemDto, "id" | "slug" | "name" | "priceGhs">;
  disabled?: boolean;
  disabledReason?: string | null;
}) {
  const { addItem } = useCart();
  const [pulse, setPulse] = useState(false);

  if (disabled) {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled
          className="w-full rounded-full bg-black/10 px-6 py-3.5 text-sm font-semibold text-muted"
        >
          Ordering paused
        </button>
        {disabledReason ? (
          <p className="mt-2 text-center text-xs text-muted">{disabledReason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem({
          id: item.id,
          slug: item.slug,
          name: item.name,
          priceGhs: item.priceGhs,
        });
        setPulse(true);
        window.setTimeout(() => setPulse(false), 700);
      }}
      className={`w-full rounded-full bg-rubies-red px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-rubies-red-deep active:scale-[0.98] ${
        pulse ? "animate-pulse-once" : ""
      }`}
    >
      {pulse ? "Added to cart" : "Add to cart · local"}
    </button>
  );
}
