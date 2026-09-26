"use client";

import type { AddressDto, DeliveryQuoteDto, PaymentMethod } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useDeliveryLocation } from "@/components/LocationProvider";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { applyServerCart, pushLocalCartToServer, useCart, useHasMounted } from "@/lib/cart";
import { formatGhs } from "@/lib/format";

export default function CheckoutPage() {
  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Checkout"
      tagline="Confirm and pay"
    >
      <CheckoutForm />
    </AppShell>
  );
}

function CheckoutForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const mounted = useHasMounted();
  const { location, openPicker } = useDeliveryLocation();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [addressMode, setAddressMode] = useState<"saved" | "current">("current");
  const [addressId, setAddressId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoTitle, setPromoTitle] = useState<string | null>(null);
  const [discountGhs, setDiscountGhs] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [quote, setQuote] = useState<DeliveryQuoteDto | null>(null);
  const [quotedSubtotal, setQuotedSubtotal] = useState<number | null>(null);
  const [quotedTotal, setQuotedTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = brand.phones[0]!;
  const whatsapp = brand.whatsapp;

  const displaySubtotal = quotedSubtotal ?? subtotal;
  const message = encodeURIComponent(
    `Hi Rubies Cuisine! I'd like to order:\n${lines
      .map((l) => `• ${l.quantity}x ${l.name}`)
      .join("\n")}\nTotal (food): ${formatGhs(displaySubtotal)}`,
  );

  useEffect(() => {
    if (!user) return;
    void clientApi
      .listAddresses()
      .then((list) => {
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) ?? list[0];
        if (preferred) {
          setAddressId(preferred.id);
          setAddressMode("saved");
        }
        if (user.preferredPayment) setPaymentMethod(user.preferredPayment);
        if (user.name) setGuestName(user.name);
        if (user.phone) setGuestPhone(user.phone);
      })
      .catch(() => {
        /* ignore */
      });
  }, [user]);

  const quotePayload = useMemo(() => {
    if (addressMode === "saved" && addressId) {
      return { addressId };
    }
    return { lat: location.lat, lng: location.lng };
  }, [addressMode, addressId, location.lat, location.lng]);

  useEffect(() => {
    if (!mounted || lines.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const synced = await pushLocalCartToServer();
        applyServerCart(synced);
        const data = await clientApi.quoteDelivery(quotePayload);
        if (!cancelled) {
          setQuote(data.quote);
          setQuotedSubtotal(data.subtotalGhs);
          setQuotedTotal(data.totalGhs);
          // Re-validate promo against new subtotal if one was applied
          setDiscountGhs(0);
          setPromoTitle(null);
          setPromoError(null);
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
          setQuotedSubtotal(null);
          setQuotedTotal(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, lines.length, quotePayload]);

  const deliveryFee = quote?.withinRange ? (quote.deliveryFeeGhs ?? 0) : 0;
  const total =
    quotedTotal != null && quote?.withinRange
      ? Math.max(0, quotedTotal - discountGhs)
      : Math.max(
          0,
          Math.round((displaySubtotal + deliveryFee - discountGhs) * 100) / 100,
        );

  async function onApplyPromo() {
    setPromoError(null);
    setPromoBusy(true);
    try {
      await pushLocalCartToServer();
      const preview = await clientApi.previewPromo({
        code: promoCode.trim(),
        ...quotePayload,
      });
      setPromoCode(preview.code);
      setPromoTitle(preview.title);
      setDiscountGhs(preview.discountGhs);
      setQuotedSubtotal(preview.subtotalGhs);
      setQuotedTotal(preview.subtotalGhs + preview.deliveryFeeGhs);
      setQuote(preview.quote);
      toast(`${preview.code} applied · −${formatGhs(preview.discountGhs)}`);
    } catch (err) {
      setDiscountGhs(0);
      setPromoTitle(null);
      setPromoError(
        err instanceof ApiRequestError ? err.message : "Could not apply promo",
      );
    } finally {
      setPromoBusy(false);
    }
  }

  async function onPlaceOrder() {
    setError(null);
    setBusy(true);
    try {
      const synced = await pushLocalCartToServer();
      applyServerCart(synced);

      const result = await clientApi.placeOrder({
        paymentMethod,
        addressId: addressMode === "saved" && addressId ? addressId : undefined,
        delivery:
          addressMode === "current"
            ? {
                line1: location.line1,
                landmark: location.landmark || null,
                city: location.city || "Accra",
                lat: location.lat,
                lng: location.lng,
              }
            : undefined,
        guestName: guestName.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || null,
        promoCode: promoCode.trim() || null,
      });

      await clear();

      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }

      toast(`${result.order.orderNumber} placed`);
      router.push(`/orders/${result.order.orderNumber}`);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Could not place order";
      setError(msg);
      toast({ message: msg, sound: false });
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || authLoading) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
          Preparing checkout…
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
          <p className="text-sm text-muted">Your cart is empty.</p>
          <Link
            href="/menu"
            className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="mt-4 space-y-4">
        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Contact</h2>
          <div className="mt-3 space-y-3">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-full border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-rubies-blue"
            />
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Phone (for rider updates)"
              inputMode="tel"
              className="w-full rounded-full border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-rubies-blue"
            />
          </div>
          {!user ? (
            <p className="mt-2 text-xs text-muted">
              Guests can checkout.{" "}
              <Link href="/login" className="font-medium text-rubies-blue">
                Sign in
              </Link>{" "}
              to save addresses.
            </p>
          ) : null}
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Delivery address</h2>
            <button
              type="button"
              onClick={openPicker}
              className="text-xs font-semibold text-rubies-blue"
            >
              Change pin
            </button>
          </div>

          {addresses.length > 0 ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAddressMode("saved")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  addressMode === "saved"
                    ? "bg-rubies-blue text-white"
                    : "bg-cream-deep text-muted"
                }`}
              >
                Saved
              </button>
              <button
                type="button"
                onClick={() => setAddressMode("current")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  addressMode === "current"
                    ? "bg-rubies-blue text-white"
                    : "bg-cream-deep text-muted"
                }`}
              >
                Current pin
              </button>
            </div>
          ) : null}

          {addressMode === "saved" && addresses.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {addresses.map((address) => (
                <li key={address.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream px-3 py-3 ring-1 ring-black/5">
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {address.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {address.line1}
                        {address.landmark ? ` · ${address.landmark}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink">
              {location.line1}
              {location.landmark ? (
                <span className="block text-xs text-muted">{location.landmark}</span>
              ) : null}
            </p>
          )}
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Payment</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                { id: "cod", label: "Cash on delivery" },
                { id: "paystack", label: "Paystack" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPaymentMethod(option.id)}
                className={`rounded-2xl px-3 py-3 text-left text-sm font-semibold ring-1 transition ${
                  paymentMethod === option.id
                    ? "bg-rubies-red text-white ring-rubies-red"
                    : "bg-cream text-ink ring-black/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Gate code, spice level, etc."
            className="mt-3 w-full resize-none rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none focus:border-rubies-blue"
          />
          <label
            className="mt-3 block text-xs font-medium text-muted"
            htmlFor="checkout-promo"
          >
            Promo code
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="checkout-promo"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setDiscountGhs(0);
                setPromoTitle(null);
                setPromoError(null);
              }}
              placeholder="e.g. RUBIES10"
              className="min-w-0 flex-1 rounded-full border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-rubies-blue"
            />
            <button
              type="button"
              disabled={promoBusy || !promoCode.trim()}
              onClick={() => void onApplyPromo()}
              className="shrink-0 rounded-full bg-rubies-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {promoBusy ? "…" : "Apply"}
            </button>
          </div>
          {promoTitle && discountGhs > 0 ? (
            <p className="mt-2 text-xs font-medium text-emerald-800">
              {promoTitle} · −{formatGhs(discountGhs)}
            </p>
          ) : null}
          {promoError ? (
            <p className="mt-2 text-xs text-rubies-red">{promoError}</p>
          ) : null}
          <Link href="/offers" className="mt-2 inline-block text-xs font-medium text-rubies-blue">
            Browse offers
          </Link>
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold">{formatGhs(displaySubtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">Delivery</span>
            <span className="font-semibold">
              {quote
                ? quote.withinRange
                  ? formatGhs(quote.deliveryFeeGhs)
                  : "—"
                : "…"}
            </span>
          </div>
          {discountGhs > 0 ? (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Promo</span>
              <span className="font-semibold text-emerald-800">
                −{formatGhs(discountGhs)}
              </span>
            </div>
          ) : null}
          {quote?.message ? (
            <p className="mt-2 text-xs text-muted">{quote.message}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-base">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-display text-lg font-bold text-rubies-red">
              {formatGhs(total)}
            </span>
          </div>
        </section>

        {error ? (
          <p className="text-center text-sm text-rubies-red">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={busy || (quote != null && !quote.withinRange)}
          onClick={() => void onPlaceOrder()}
          className="w-full rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-rubies-red-deep disabled:bg-black/20 disabled:text-muted"
        >
          {busy
            ? "Placing order…"
            : paymentMethod === "paystack"
              ? `Pay ${formatGhs(total)} with Paystack`
              : `Place COD order · ${formatGhs(total)}`}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${phone}`}
            className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-ink ring-1 ring-black/10"
          >
            Call
          </a>
          <a
            href={`https://wa.me/${whatsapp}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
