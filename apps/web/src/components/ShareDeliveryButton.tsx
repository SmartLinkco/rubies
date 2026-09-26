"use client";

import type { OrderDto } from "@rubies/shared";
import { brand } from "@rubies/shared";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

type PickupPoint = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const DEFAULT_PICKUP: PickupPoint = {
  name: brand.name,
  address: brand.address,
  lat: 5.683,
  lng: -0.266,
};

export function buildDeliveryShareText(order: OrderDto, pickup: PickupPoint) {
  const items = order.items
    .map((item) => `• ${item.quantity}× ${item.name}`)
    .join("\n");
  const address = [
    order.deliveryLine1,
    order.deliveryLandmark,
    order.deliveryCity,
  ]
    .filter(Boolean)
    .join(", ");
  const payment =
    order.paymentMethod === "cod"
      ? order.paymentStatus === "paid"
        ? "Cash on delivery (paid)"
        : "Cash on delivery (collect)"
      : order.paymentStatus === "paid"
        ? "Paid online (Paystack)"
        : "Paystack (pending)";

  return [
    `🛵 ${pickup.name} — delivery job`,
    "",
    `Customer: ${order.guestName ?? "Guest"}`,
    order.guestPhone ? `Phone: ${order.guestPhone}` : null,
    `Deliver to: ${address}`,
    "",
    "Items:",
    items,
    "",
    `Total: ${formatGhs(order.totalGhs)} · ${payment}`,
    order.notes ? `Notes: ${order.notes}` : null,
    "",
    `Pickup: ${pickup.address}`,
    `Ref: ${order.orderNumber}`,
  ]
    .filter((line) => line != null)
    .join("\n");
}

function mapsDirUrl(
  pickup: PickupPoint,
  dropLat: number | null,
  dropLng: number | null,
  dropAddress: string,
) {
  const origin = `${pickup.lat},${pickup.lng}`;
  const destination =
    dropLat != null && dropLng != null
      ? `${dropLat},${dropLng}`
      : encodeURIComponent(dropAddress);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

function uberUrl(
  pickup: PickupPoint,
  dropLat: number | null,
  dropLng: number | null,
  dropAddress: string,
  dropName: string,
) {
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": String(pickup.lat),
    "pickup[longitude]": String(pickup.lng),
    "pickup[nickname]": pickup.name,
    "pickup[formatted_address]": pickup.address,
  });
  if (dropLat != null && dropLng != null) {
    params.set("dropoff[latitude]", String(dropLat));
    params.set("dropoff[longitude]", String(dropLng));
  }
  params.set("dropoff[nickname]", dropName);
  params.set("dropoff[formatted_address]", dropAddress);
  return `https://m.uber.com/ul/?${params.toString()}`;
}

function boltUrl(
  pickup: PickupPoint,
  dropLat: number | null,
  dropLng: number | null,
) {
  if (dropLat == null || dropLng == null) return null;
  const params = new URLSearchParams({
    pickup_lat: String(pickup.lat),
    pickup_lng: String(pickup.lng),
    destination_lat: String(dropLat),
    destination_lng: String(dropLng),
  });
  return `https://bolt.eu/en/ride/?${params.toString()}`;
}

function yangoUrl(
  pickup: PickupPoint,
  dropLat: number | null,
  dropLng: number | null,
) {
  if (dropLat == null || dropLng == null) return null;
  const params = new URLSearchParams({
    "start-lat": String(pickup.lat),
    "start-lon": String(pickup.lng),
    "end-lat": String(dropLat),
    "end-lon": String(dropLng),
  });
  return `https://yango.go.link/route?${params.toString()}`;
}

export function ShareDeliveryButton({ order }: { order: OrderDto }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pickup, setPickup] = useState<PickupPoint>(DEFAULT_PICKUP);

  useEffect(() => {
    if (!open) return;
    void clientApi
      .getAdminSettings()
      .then((s) => {
        setPickup({
          name: s.name || brand.name,
          address: s.address || brand.address,
          lat: s.restaurantLat || DEFAULT_PICKUP.lat,
          lng: s.restaurantLng || DEFAULT_PICKUP.lng,
        });
      })
      .catch(() => undefined);
  }, [open]);

  const dropAddress = useMemo(
    () =>
      [order.deliveryLine1, order.deliveryLandmark, order.deliveryCity]
        .filter(Boolean)
        .join(", "),
    [order],
  );

  const text = useMemo(
    () => buildDeliveryShareText(order, pickup),
    [order, pickup],
  );

  const hasCoords = order.deliveryLat != null && order.deliveryLng != null;
  const bolt = boltUrl(pickup, order.deliveryLat, order.deliveryLng);
  const yango = yangoUrl(pickup, order.deliveryLat, order.deliveryLng);
  const uber = uberUrl(
    pickup,
    order.deliveryLat,
    order.deliveryLng,
    dropAddress,
    order.guestName ?? "Customer",
  );
  const maps = mapsDirUrl(
    pickup,
    order.deliveryLat,
    order.deliveryLng,
    dropAddress,
  );
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Delivery details copied");
    } catch {
      toast({
        message: "Could not copy — try WhatsApp share",
        sound: false,
      });
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyDetails();
      return;
    }
    try {
      await navigator.share({
        title: `${pickup.name} delivery`,
        text,
      });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Share ride for delivery"
        title="Share ride"
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink ring-1 ring-black/10 transition active:scale-95"
      >
        <ShareIcon />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            aria-label="Close share sheet"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-[28px] bg-cream px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-soft sm:rounded-[28px] sm:pb-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rubies-red">
                  Send to rider
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">
                  Share delivery
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {order.guestName ?? "Guest"} · {dropAddress}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-black/5"
              >
                Close
              </button>
            </div>

            {!hasCoords ? (
              <p className="mt-3 rounded-[16px] bg-amber-50 px-3 py-2 text-xs text-amber-950">
                No pin on this address — maps apps work best with WhatsApp or
                copy, using the written address.
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <ShareAction
                href={whatsapp}
                label="WhatsApp"
                hint="Message rider"
                tone="whatsapp"
                icon={<WhatsAppGlyph />}
              />
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex items-center gap-3 rounded-[18px] bg-white px-3 py-3 text-left shadow-soft ring-1 ring-black/[0.04] transition active:scale-[0.98]"
              >
                <IconBadge className="bg-ink text-white">
                  <ShareIcon />
                </IconBadge>
                <span>
                  <p className="text-sm font-semibold text-ink">Share sheet</p>
                  <p className="mt-0.5 text-[11px] text-muted">Any app</p>
                </span>
              </button>
              <ShareAction
                href={uber}
                label="Uber"
                hint="Open ride"
                icon={<UberGlyph />}
                badgeClass="bg-ink text-white"
              />
              {bolt ? (
                <ShareAction
                  href={bolt}
                  label="Bolt"
                  hint="Open ride"
                  icon={<BoltGlyph />}
                  badgeClass="bg-[#34D186] text-ink"
                />
              ) : (
                <DisabledAction
                  label="Bolt"
                  hint="Needs map pin"
                  icon={<BoltGlyph />}
                  badgeClass="bg-[#34D186] text-ink"
                />
              )}
              {yango ? (
                <ShareAction
                  href={yango}
                  label="Yango"
                  hint="Open ride"
                  icon={<YangoGlyph />}
                  badgeClass="bg-[#FC3F1D] text-white"
                />
              ) : (
                <DisabledAction
                  label="Yango"
                  hint="Needs map pin"
                  icon={<YangoGlyph />}
                  badgeClass="bg-[#FC3F1D] text-white"
                />
              )}
              <ShareAction
                href={maps}
                label="Maps"
                hint="Pickup → drop"
                icon={<MapsGlyph />}
                badgeClass="bg-[#4285F4] text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => void copyDetails()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-sm font-semibold text-white"
            >
              <CopyGlyph />
              Copy order details
            </button>

            <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-[18px] bg-white px-3 py-3 text-[11px] leading-relaxed text-muted ring-1 ring-black/[0.04]">
              {text}
            </pre>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ShareAction({
  href,
  label,
  hint,
  icon,
  tone,
  badgeClass = "bg-cream-deep text-ink",
}: {
  href: string;
  label: string;
  hint: string;
  icon: ReactNode;
  tone?: "whatsapp";
  badgeClass?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-[18px] px-3 py-3 shadow-soft ring-1 transition active:scale-[0.98] ${
        tone === "whatsapp"
          ? "bg-[#25D366] text-white ring-[#1ebe57]/30"
          : "bg-white text-ink ring-black/[0.04]"
      }`}
    >
      <IconBadge
        className={
          tone === "whatsapp" ? "bg-white/20 text-white" : badgeClass
        }
      >
        {icon}
      </IconBadge>
      <span>
        <p className="text-sm font-semibold">{label}</p>
        <p
          className={`mt-0.5 text-[11px] ${
            tone === "whatsapp" ? "text-white/85" : "text-muted"
          }`}
        >
          {hint}
        </p>
      </span>
    </a>
  );
}

function DisabledAction({
  label,
  hint,
  icon,
  badgeClass,
}: {
  label: string;
  hint: string;
  icon: ReactNode;
  badgeClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-white/60 px-3 py-3 opacity-55 ring-1 ring-black/[0.04]">
      <IconBadge className={badgeClass}>{icon}</IconBadge>
      <span>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      </span>
    </div>
  );
}

function IconBadge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${className}`}
    >
      {children}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.2 10.8 15.8 6.7M8.2 13.2l7.6 4.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function UberGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 2.2A7.8 7.8 0 0 1 19.8 12H13.5V9.2h-3V12H4.2A7.8 7.8 0 0 1 12 4.2Zm0 15.6A7.8 7.8 0 0 1 4.2 12H10.5v2.8h3V12h6.3A7.8 7.8 0 0 1 12 19.8Z" />
    </svg>
  );
}

function BoltGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.2 2 4 13.5h6.2L9.1 22 20 10.2h-6.5L13.2 2Z" />
    </svg>
  );
}

function YangoGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3c-2.8 0-5 1.9-5 4.7 0 2.2 1.2 3.7 2.6 5.1l.5.5c1.2 1.1 2.4 2.3 2.4 4.2V20h2.5v-2.5c0-2.6-1.5-4-2.9-5.3l-.5-.5C9.5 10.5 8.5 9.5 8.5 7.7c0-1.6 1.2-2.7 3.5-2.7s3.5 1.1 3.5 2.7H18c0-2.8-2.2-4.7-6-4.7Z" />
    </svg>
  );
}

function MapsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6-5.2 6-10.2A6 6 0 0 0 6 10.8C6 15.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.2" fill="currentColor" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
