"use client";

import { brand } from "@rubies/shared";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";
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
    <>
      <Onboarding />
      <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-ink">Cart</h1>
          {mounted && lines.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-muted"
            >
              Clear
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted">
          Local cart for now — checkout arrives in Phase 3. Finish via Call or WhatsApp.
        </p>

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
                      {formatGhs(line.priceGhs)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-cream-deep px-2 py-1">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full text-lg font-medium text-ink"
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full text-lg font-medium text-ink"
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
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
                Delivery fee calculated at checkout (Phase 3).
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={`tel:${phone}`}
                className="rounded-full bg-rubies-red px-4 py-3.5 text-center text-sm font-semibold text-white"
              >
                Call to order
              </a>
              <a
                href={`https://wa.me/${whatsapp}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
      <BottomNav phone={phone} whatsapp={whatsapp} />
    </>
  );
}
