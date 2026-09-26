"use client";

import Link from "next/link";
import { useCart, useHasMounted } from "@/lib/cart";
import { useDeliveryLocation } from "@/components/LocationProvider";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function HomeTopBar({
  title,
  tagline,
}: {
  title: string;
  tagline: string;
}) {
  const { count } = useCart();
  const mounted = useHasMounted();

  return (
    <header className="animate-rise flex items-start justify-between gap-3">
      <Link
        href="/profile"
        className="mt-1 flex h-10 w-10 items-center justify-center rounded-full text-ink"
        aria-label="Open profile"
      >
        <MenuIcon />
      </Link>

      <div className="min-w-0 flex-1 pt-0.5 text-center">
        <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-0.5 text-sm text-muted">{tagline}</p>
      </div>

      <Link
        href="/cart"
        className="relative mt-1 flex h-10 w-10 items-center justify-center rounded-full text-ink"
        aria-label="Open cart"
      >
        <BagIcon />
        {mounted && count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rubies-red px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rubies-red" />
        )}
      </Link>
    </header>
  );
}

export function DeliveryHeroCard({
  phone,
  whatsapp,
  isAcceptingOrders,
  etaLabel = "25–35 min",
}: {
  phone: string;
  whatsapp: string;
  isAcceptingOrders: boolean;
  etaLabel?: string;
}) {
  const { location, openPicker, ready } = useDeliveryLocation();

  return (
    <section className="animate-rise" style={{ animationDelay: "60ms" }}>
      <div className="relative overflow-hidden rounded-[28px] bg-rubies-red p-5 text-white shadow-[0_18px_40px_rgba(225,6,0,0.28)]">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-black/10"
          aria-hidden
        />

        <div className="relative grid grid-cols-[1.15fr_0.85fr] gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={openPicker}
              className="w-full rounded-soft text-left transition active:scale-[0.99]"
            >
              <p className="text-[12px] font-medium text-white/75">Deliver to</p>
              <span className="mt-0.5 flex items-center gap-1 text-[1.35rem] font-bold leading-tight text-white">
                {ready ? location.label || "Home" : "…"}
                <ChevronDown />
              </span>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/85">
                {ready ? location.line1 : "Loading location…"}
              </p>
              {ready && location.lat != null && location.lng != null ? (
                <p className="mt-1 text-[11px] text-white/65">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              ) : null}
            </button>

            <div className="mt-4 border-t border-white/20 pt-3">
              <p className="text-[12px] font-medium text-white/75">
                Estimated Delivery
              </p>
              <p className="mt-0.5 text-[1.35rem] font-bold leading-none text-white">
                {isAcceptingOrders ? etaLabel : "Paused"}
              </p>
            </div>

            <Link
              href="/orders"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rubies-red shadow-sm transition hover:bg-cream active:scale-[0.98]"
            >
              <TrackIcon />
              Track Order
            </Link>
          </div>

          <div className="relative flex min-h-[168px] flex-col items-end justify-between">
            <CourierIllustration />

            <div className="flex gap-2 pb-0.5 pr-0.5">
              <a
                href={`tel:${phone}`}
                aria-label="Call Rubies Cuisine"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white shadow-md backdrop-blur-md ring-1 ring-white/30 transition hover:bg-white/30 active:scale-95"
              >
                <PhoneIcon />
              </a>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp Rubies Cuisine"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white shadow-md backdrop-blur-md ring-1 ring-white/30 transition hover:bg-white/30 active:scale-95"
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h10M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIcon() {
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

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" opacity="0.45" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 2.8c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8l-1.2 1.2a12.5 12.5 0 0 0 5.8 5.8l1.2-1.2c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8l-1.5 1.5c-.5.5-1.3.7-2 .4A16.8 16.8 0 0 1 4.9 6.3c-.3-.7-.1-1.5.4-2l1.3-1.5Z" />
    </svg>
  );
}

function CourierIllustration() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/delivery-rider.png"
      alt=""
      aria-hidden
      className="h-[148px] w-auto max-w-[130px] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)]"
      draggable={false}
    />
  );
}
