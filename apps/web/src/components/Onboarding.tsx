"use client";

import { useEffect, useState } from "react";
import { AppImage } from "@/components/AppImage";
import { BrandMark } from "@/components/BrandMark";

const STORAGE_KEY = "rubies_onboarded_v1";

const slides = [
  {
    title: "Home-cooked Ghanaian meals",
    body: "Jollof, fufu, banku, and grilled chicken, prepared fresh in Achiaman.",
    image: "/onboarding/onboard-1.webp",
    tone: "from-[#e10600]/75 via-[#1b3a9c]/45 to-transparent",
  },
  {
    title: "Order your way",
    body: "Build a cart in the app, or call / WhatsApp us directly. Whichever is easier.",
    image: "/onboarding/onboard-2.webp",
    tone: "from-[#1b3a9c]/75 via-[#e10600]/40 to-transparent",
  },
  {
    title: "Closed Wednesdays",
    body: "Browse anytime. Ordering pauses on Wednesdays. We open again Thursday.",
    image: "/onboarding/onboard-3.webp",
    tone: "from-[#b80500]/70 via-[#2f4fb8]/40 to-transparent",
  },
] as const;

export function Onboarding() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"splash" | "slides">("splash");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY) === "1";
    setOpen(!done);
    setReady(true);
    if (!done) {
      const t = window.setTimeout(() => setPhase("slides"), 1400);
      return () => window.clearTimeout(t);
    }
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!ready || !open) return null;

  if (phase === "splash") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cream animate-fade-in">
        <div className="text-center animate-rise">
          <BrandMark size={80} className="mx-auto mb-5 shadow-soft" priority />
          <h1 className="font-display text-4xl font-bold text-ink">Rubies Cuisine</h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-rubies-blue">
            Are you hungry? Don&apos;t wait!
          </p>
        </div>
      </div>
    );
  }

  const slide = slides[index]!;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-cream">
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-muted backdrop-blur-sm"
      >
        Skip
      </button>

      <div className="relative mx-4 mt-16 h-[48vh] overflow-hidden rounded-sheet shadow-soft animate-fade-in">
        <AppImage
          key={slide.image}
          src={slide.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          priority={index === 0}
          className="object-cover"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${slide.tone}`}
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
            Rubies Cuisine
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-10 pt-8">
        <h2 className="font-display text-3xl font-bold leading-tight text-ink animate-rise">
          {slide.title}
        </h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
          {slide.body}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-8">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-rubies-red" : "w-2 bg-black/15"
                }`}
              />
            ))}
          </div>

          {index < slides.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((v) => v + 1)}
              className="rounded-full bg-rubies-red px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-rubies-red-deep active:scale-[0.98]"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="rounded-full bg-rubies-red px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-rubies-red-deep active:scale-[0.98]"
            >
              Start exploring
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
