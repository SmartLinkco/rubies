"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rubies_onboarded_v1";

const slides = [
  {
    title: "Home-cooked Ghanaian meals",
    body: "Jollof, fufu, banku, and grilled chicken, prepared fresh in Amamorley.",
    tone: "from-[#e10600]/90 to-[#1b3a9c]/90",
  },
  {
    title: "Order your way",
    body: "Build a cart in the app, or call / WhatsApp us directly. Whichever is easier.",
    tone: "from-[#1b3a9c]/90 to-[#e10600]/80",
  },
  {
    title: "Closed Wednesdays",
    body: "Browse anytime. Ordering pauses on Wednesdays. We open again Thursday.",
    tone: "from-[#b80500]/90 to-[#2f4fb8]/85",
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
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rubies-red text-3xl font-bold text-white shadow-soft">
            R
          </div>
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
        className="absolute right-4 top-4 z-10 rounded-full px-3 py-1.5 text-sm font-medium text-muted"
      >
        Skip
      </button>

      <div
        className={`relative mx-4 mt-16 h-[48vh] overflow-hidden rounded-sheet bg-gradient-to-br ${slide.tone} shadow-soft animate-fade-in`}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white, transparent 40%), radial-gradient(circle at 80% 70%, white, transparent 35%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
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
