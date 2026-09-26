"use client";

import type { MenuItemDto, OfferDto, RestaurantPublicDto } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BrandMark } from "@/components/BrandMark";
import { DishVisual } from "@/components/DishVisual";
import { useToast } from "@/components/ToastProvider";
import { useCart, useHasMounted } from "@/lib/cart";
import { formatGhs } from "@/lib/format";

export function MenuItemDetail({
  item,
  restaurant,
  offer,
}: {
  item: MenuItemDto;
  restaurant: RestaurantPublicDto | null;
  offer: OfferDto | null;
}) {
  const accepting = restaurant?.isAcceptingOrders ?? true;
  const fee = restaurant?.fixedDeliveryFeeGhs ?? 10;
  const categories = [item.category, "Ghanaian", "Delivery"].filter(Boolean);
  const offerLine = offer
    ? offer.percentOff
      ? `${offer.percentOff}% off food`
      : offer.amountOffGhs
        ? `${formatGhs(offer.amountOffGhs)} off`
        : offer.title
    : null;
  const [aboutOpen, setAboutOpen] = useState(false);
  const longAbout = (item.description?.length ?? 0) > 120;
  const aboutText =
    longAbout && !aboutOpen
      ? `${item.description.slice(0, 110).trimEnd()}…`
      : item.description;

  return (
    <div className="relative pb-28">
      <div className="relative">
        <DishVisual
          slug={item.slug}
          imageUrl={item.imageUrl}
          className="h-[38vh] min-h-[220px] w-full"
          priority
        />
        <Link
          href="/menu"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg text-ink shadow-soft backdrop-blur-sm"
          aria-label="Back to menu"
        >
          ←
        </Link>
        <HeroCartButton />
      </div>

      <div className="relative z-10 -mt-10 rounded-t-[28px] bg-white px-4 pb-6 pt-6 shadow-[0_-8px_30px_rgba(26,26,26,0.08)]">
        <div className="absolute -top-6 left-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
          <BrandMark size={40} />
        </div>

        <div className="mt-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[1.75rem] font-bold leading-tight text-ink">
                  {item.name}
                </h1>
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rubies-red text-[10px] font-bold text-white"
                  aria-hidden
                >
                  ✓
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted">
                {categories.join(" · ")}
              </p>
            </div>
            <p className="shrink-0 pt-1 text-lg font-bold text-rubies-red">
              {formatGhs(item.priceGhs)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-y-2 text-sm text-ink">
            <Stat icon={<StarIcon />} label="Fresh daily" />
            <Divider />
            <Stat icon={<ClockIcon />} label="25–35 min" />
            <Divider />
            <Stat icon={<BagIcon />} label={`${formatGhs(fee)} Delivery`} />
          </div>

          {offer && offerLine ? (
            <div className="mt-5 flex items-center gap-3 rounded-[18px] bg-[#FFF0E8] px-3.5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <FlameIcon />
                  <p className="text-sm font-medium text-ink">{offerLine}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                  <span className="text-xs text-muted">Use code:</span>
                  <PromoCodePill code={offer.code} />
                </div>
              </div>
              <Link
                href="/offers"
                className="shrink-0 rounded-full bg-rubies-red px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm"
              >
                View Offers
              </Link>
            </div>
          ) : null}

          <section className="mt-6">
            <h2 className="text-base font-bold text-ink">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{aboutText}</p>
            {longAbout ? (
              <button
                type="button"
                onClick={() => setAboutOpen((v) => !v)}
                className="mt-2 text-sm font-medium text-rubies-red"
              >
                {aboutOpen ? "See less" : "See more"}
              </button>
            ) : (
              <p className="mt-2 text-right text-sm font-medium text-rubies-red">
                {brand.name}
              </p>
            )}
            {!accepting && restaurant?.closedReason ? (
              <p className="mt-3 text-sm text-rubies-red">{restaurant.closedReason}</p>
            ) : null}
          </section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="pointer-events-auto mx-auto max-w-md px-4">
          <div className="bg-gradient-to-t from-white from-40% via-white/90 to-transparent pb-1 pt-4">
            <AddToCartButton
              item={item}
              disabled={!accepting}
              disabledReason={restaurant?.closedReason}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCartButton() {
  const { count } = useCart();
  const mounted = useHasMounted();

  return (
    <Link
      href="/cart"
      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft backdrop-blur-sm"
      aria-label="Open cart"
    >
      <BagIconLarge />
      {mounted && count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rubies-red px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rubies-red" />
      )}
    </Link>
  );
}

function PromoCodePill({ code }: { code: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Copy promo code ${code}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast(`${code} copied`);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          toast(`Code: ${code}`);
        }
      }}
      className="rounded-full border border-dashed border-rubies-red/40 bg-white px-2.5 py-1 text-xs font-bold tracking-wide text-ink transition active:scale-95"
    >
      {copied ? "Copied!" : code}
    </button>
  );
}

function Stat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-rubies-red">{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="mx-2.5 inline-block h-3.5 w-px bg-black/15" aria-hidden />;
}

function FlameIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mt-0.5 shrink-0 text-rubies-red"
      aria-hidden
    >
      <path d="M12 2c1.5 3 1 5.5-.5 7.2C13.2 8.4 15 9.8 15 13a5 5 0 0 1-9.5 2.2C6.8 16.5 8 15.2 8 13.5c0-2.2 1.8-3.8 2.6-5.8.4 1.3.2 2.4-.6 3.5C11.4 9.8 13 7.5 12 2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.5 14.7 9l6 .5-4.6 3.9 1.4 5.8L12 16.8 6.5 19.2l1.4-5.8L3.3 9.5l6-.5L12 3.5Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-.8 11.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 8V6.5A3 3 0 0 1 12 3.5a3 3 0 0 1 3 3V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIconLarge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 9h11l-.8 10.2a1.5 1.5 0 0 1-1.5 1.4H8.8a1.5 1.5 0 0 1-1.5-1.4L6.5 9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V7.5a3 3 0 0 1 6 0V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
