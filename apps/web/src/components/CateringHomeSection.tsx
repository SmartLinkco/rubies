"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type PromoAd = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  tone: "blue" | "red";
  image: string;
};

const ADS: PromoAd[] = [
  {
    id: "events",
    eyebrow: "Catering · bulk · events",
    title: "We also take event orders",
    body: "Birthdays, weddings, church programmes, office parties, and more. Share the date, guest count, and menu idea. Rubies will call you back with a quote.",
    primary: { href: "/catering", label: "Book an event" },
    secondary: { href: "/about", label: "Learn more" },
    tone: "blue",
    image: "/ads/ad-events.png",
  },
  {
    id: "space",
    eyebrow: "Venue · events",
    title: "Book our event space",
    body: "A full venue for large gatherings, receptions, programmes, and celebrations. Share your date and guest count to check availability and reserve.",
    primary: { href: "/event-space", label: "Book the space" },
    secondary: { href: "/about", label: "Learn more" },
    tone: "red",
    image: "/ads/ad-event-space.png",
  },
];

export function CateringHomeSection() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const active = useRef(false);
  const pauseUntil = useRef(0);

  const go = useCallback((next: number) => {
    const len = ADS.length;
    setIndex(((next % len) + len) % len);
    setDragX(0);
  }, []);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      if (active.current) return;
      setIndex((i) => (i + 1) % ADS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    active.current = true;
    setDragging(true);
    startX.current = e.clientX;
    pauseUntil.current = Date.now() + 8000;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    setDragX(e.clientX - startX.current);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    const delta = e.clientX - startX.current;
    if (delta < -56) next();
    else if (delta > 56) prev();
    else setDragX(0);
  }

  return (
    <section className="mt-8 animate-rise" style={{ animationDelay: "120ms" }}>
      <div
        className="relative touch-pan-y select-none overflow-hidden rounded-[28px] shadow-[0_16px_36px_rgba(27,58,156,0.22)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotions"
      >
        <div
          className={`flex ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
          }}
        >
          {ADS.map((ad) => (
            <div key={ad.id} className="w-full shrink-0">
              <PromoSlide ad={ad} />
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {ADS.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`Show ad ${i + 1}`}
              aria-current={i === index}
              onClick={() => {
                pauseUntil.current = Date.now() + 8000;
                go(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/45"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Swipe for more</p>
    </section>
  );
}

function PromoSlide({ ad }: { ad: PromoAd }) {
  const isBlue = ad.tone === "blue";
  return (
    <div className="relative min-h-[240px] overflow-hidden text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={`absolute inset-0 ${
          isBlue
            ? "bg-gradient-to-r from-rubies-blue/92 via-rubies-blue/78 to-rubies-blue/35"
            : "bg-gradient-to-r from-rubies-red/92 via-rubies-red/78 to-rubies-red/35"
        }`}
        aria-hidden
      />

      <div className="relative px-5 pb-9 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
          {ad.eyebrow}
        </p>
        <h2 className="mt-2 font-display text-[1.55rem] font-bold leading-tight tracking-tight">
          {ad.title}
        </h2>
        <p className="mt-2 max-w-[21rem] text-sm leading-relaxed text-white/90">
          {ad.body}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={ad.primary.href}
            className={`inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              isBlue
                ? "bg-white text-rubies-blue hover:bg-cream"
                : "bg-white text-rubies-red hover:bg-cream"
            }`}
          >
            {ad.primary.label}
          </Link>
          <Link
            href={ad.secondary.href}
            className="inline-flex rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
          >
            {ad.secondary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
