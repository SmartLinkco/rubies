"use client";

import type { OfferDto } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CopyCodeButton } from "@/components/CopyCodeButton";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

export default function OfferDetailPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code);
  const [offer, setOffer] = useState<OfferDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void clientApi
      .getOffer(code)
      .then(setOffer)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : "Offer not found");
      });
  }, [code]);

  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Offer"
      tagline={offer?.code ?? code}
    >
      <div className="px-4 pb-4">
        <Link href="/offers" className="text-sm font-medium text-muted">
          ← All offers
        </Link>

        {error ? (
          <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
            {error}
          </div>
        ) : !offer ? (
          <div className="mt-6 py-10 text-center text-sm text-muted">Loading…</div>
        ) : (
          <div className="mt-4 space-y-4">
            <section className="overflow-hidden rounded-card bg-white shadow-soft">
              <div className="bg-rubies-red px-5 py-6 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Use this code
                </p>
                <p className="mt-2 font-display text-3xl font-bold tracking-wide">
                  {offer.code}
                </p>
                <div className="mt-4 flex justify-center">
                  <CopyCodeButton code={offer.code} variant="dark" className="px-4 py-2 text-sm" />
                </div>
              </div>
              <div className="p-5">
                <h1 className="text-lg font-semibold text-ink">{offer.title}</h1>
                <p className="mt-2 text-sm text-muted">{offer.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink">
                  <li>
                    Discount:{" "}
                    {offer.percentOff
                      ? `${offer.percentOff}% off food`
                      : offer.amountOffGhs
                        ? formatGhs(offer.amountOffGhs)
                        : "—"}
                  </li>
                  <li>Minimum order: {formatGhs(offer.minOrderGhs)}</li>
                  <li>
                    Expires:{" "}
                    {offer.expiresAt
                      ? new Date(offer.expiresAt).toLocaleDateString()
                      : "No expiry"}
                  </li>
                </ul>
              </div>
            </section>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white"
            >
              Apply at checkout
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
