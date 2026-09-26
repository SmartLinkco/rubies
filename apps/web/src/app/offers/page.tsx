"use client";

import type { OfferDto } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CopyCodeButton } from "@/components/CopyCodeButton";
import { clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

export default function OffersPage() {
  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Offers"
      tagline="Save on your next meal"
    >
      <OffersList />
    </AppShell>
  );
}

function OffersList() {
  const [offers, setOffers] = useState<OfferDto[] | null>(null);

  useEffect(() => {
    void clientApi
      .listOffers()
      .then(setOffers)
      .catch(() => setOffers([]));
  }, []);

  if (!offers) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted">Loading offers…</div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
          No active offers right now. Check back soon.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <p className="mt-2 text-sm text-muted">
        Tap Copy, then paste the code at checkout.
      </p>
      <ul className="mt-4 space-y-3">
        {offers.map((offer) => (
          <li key={offer.id}>
            <div className="overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-black/[0.04]">
              <div className="flex items-start justify-between gap-3 bg-rubies-red px-4 py-3 text-white">
                <Link href={`/offers/${offer.code}`} className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Promo code
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-wide">
                    {offer.code}
                  </p>
                </Link>
                <CopyCodeButton code={offer.code} variant="dark" className="mt-1 shrink-0" />
              </div>
              <Link href={`/offers/${offer.code}`} className="block px-4 py-3">
                <p className="text-sm font-semibold text-ink">{offer.title}</p>
                <p className="mt-1 text-sm text-muted">{offer.description}</p>
                <p className="mt-2 text-xs text-rubies-blue">
                  Min order {formatGhs(offer.minOrderGhs)}
                  {offer.percentOff
                    ? ` · ${offer.percentOff}% off`
                    : offer.amountOffGhs
                      ? ` · ${formatGhs(offer.amountOffGhs)} off`
                      : ""}
                </p>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/checkout"
        className="mt-5 flex w-full items-center justify-center rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white"
      >
        Go to checkout
      </Link>
    </div>
  );
}
