"use client";

import { brand } from "@rubies/shared";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useCart, useHasMounted } from "@/lib/cart";
import { formatGhs } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQuantity, clear } = useCart();
  const mounted = useHasMounted();
  const phone = brand.phones[0]!;
  const whatsapp = brand.whatsapp;

  const message = encodeURIComponent(
    `Hi Rubies Cuisine! I'd like to order:\n${lines
      .map((l) => `• ${l.quantity}x ${l.name}`)
      .join("\n")}\nTotal (food): ${formatGhs(subtotal)}`,
  );

  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Cart"
      tagline="Review your items"
    >
      <div className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {mounted && lines.length > 0
              ? `${lines.reduce((n, l) => n + l.quantity, 0)} items`
              : "Add dishes from the menu"}
          </p>
          {mounted && lines.length > 0 ? (
            <button
              type="button"
              onClick={() => void clear()}
              className="shrink-0 text-sm font-medium text-muted"
            >
              Clear
            </button>
          ) : null}
        </div>

        {!mounted ? (
          <div className="mt-8 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
            Loading cart…
          </div>
        ) : lines.length === 0 ? (
          <div className="mt-8 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
            <p className="text-sm text-muted">Your cart is empty.</p>
            <Link
              href="/menu"
              className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-center justify-between gap-3 rounded-card bg-white/85 p-4 shadow-soft ring-1 ring-black/[0.04]"
                >
                  <div>
                    <Link
                      href={`/menu/${line.slug}`}
                      className="font-semibold text-ink"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-sm text-rubies-blue">
                      {formatGhs(line.priceGhs * line.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-cream-deep px-2 py-1">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full text-lg font-medium text-ink"
                      onClick={() => void setQuantity(line.id, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full text-lg font-medium text-ink"
                      onClick={() => void setQuantity(line.id, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-card bg-white/90 p-4 shadow-soft">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-ink">{formatGhs(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Delivery fee calculated at checkout.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-muted" htmlFor="promo">
                Promo code
              </label>
              <p className="mt-1.5 text-sm text-muted">
                Apply codes like <span className="font-semibold text-ink">RUBIES10</span> at{" "}
                <Link href="/checkout" className="font-medium text-rubies-blue">
                  checkout
                </Link>
                .{" "}
                <Link href="/offers" className="font-medium text-rubies-blue">
                  See offers
                </Link>
              </p>
            </div>

            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-rubies-red-deep"
            >
              Proceed to checkout
            </Link>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <a
                href={`tel:${phone}`}
                className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-ink ring-1 ring-black/10"
              >
                Call instead
              </a>
              <a
                href={`https://wa.me/${whatsapp}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
