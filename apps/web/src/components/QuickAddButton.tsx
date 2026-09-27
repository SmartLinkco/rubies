"use client";

import type { MenuItemDto } from "@rubies/shared";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/ToastProvider";

export function QuickAddButton({
  item,
  disabled = false,
  className = "",
}: {
  item: Pick<MenuItemDto, "id" | "slug" | "name" | "priceGhs">;
  disabled?: boolean;
  className?: string;
}) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [pulse, setPulse] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={disabled ? "Ordering paused" : `Add ${item.name} to cart`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        void addItem({
          id: item.id,
          slug: item.slug,
          name: item.name,
          priceGhs: item.priceGhs,
        });
        setPulse(true);
        window.setTimeout(() => setPulse(false), 500);
        toast({
          message: `${item.name} added`,
          href: "/cart",
          hrefLabel: "View cart",
          size: "sm",
          durationMs: 5000,
        });
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-rubies-red text-lg font-semibold leading-none text-white shadow-soft transition hover:bg-rubies-red-deep active:scale-95 disabled:bg-black/15 disabled:text-muted ${
        pulse ? "animate-pulse-once" : ""
      } ${className}`}
    >
      {pulse ? "✓" : "+"}
    </button>
  );
}
