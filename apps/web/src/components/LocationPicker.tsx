"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LocationComposer } from "@/components/LocationComposer";
import { useDeliveryLocation } from "@/components/LocationProvider";
import { clientApi } from "@/lib/client-api";
import type { DeliveryLocation } from "@/lib/location";

export function LocationPicker() {
  const { location, setLocation, pickerOpen, closePicker } = useDeliveryLocation();
  const { user } = useAuth();
  const [draft, setDraft] = useState<DeliveryLocation>(location);
  const [saved, setSaved] = useState<DeliveryLocation[]>([]);

  useEffect(() => {
    if (!pickerOpen) return;
    setDraft(location);
  }, [pickerOpen, location]);

  useEffect(() => {
    if (!pickerOpen || !user) {
      setSaved([]);
      return;
    }
    void clientApi
      .listAddresses()
      .then((addresses) =>
        setSaved(
          addresses.map((a) => ({
            label: a.label,
            line1: a.line1 + (a.landmark ? ` · ${a.landmark}` : ""),
            city: a.city,
            lat: a.lat,
            lng: a.lng,
            source: "saved" as const,
          })),
        ),
      )
      .catch(() => setSaved([]));
  }, [pickerOpen, user]);

  if (!pickerOpen) return null;

  function confirm() {
    setLocation({
      ...draft,
      label: draft.label.trim() || "Home",
    });
    closePicker();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close location picker"
        onClick={closePicker}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-cream shadow-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Delivery location
            </p>
            <h2 className="font-display text-xl font-bold text-ink">Where to?</h2>
          </div>
          <button
            type="button"
            onClick={closePicker}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-muted shadow-soft"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <LocationComposer value={draft} onChange={setDraft} />

          {saved.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Saved addresses
              </p>
              <ul className="space-y-2">
                {saved.map((item, i) => (
                  <li key={`${item.label}-${i}`}>
                    <button
                      type="button"
                      onClick={() => setDraft(item)}
                      className="w-full rounded-card bg-white px-4 py-3 text-left shadow-soft ring-1 ring-black/[0.04]"
                    >
                      <p className="text-sm font-semibold text-ink">{item.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {item.line1}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="border-t border-black/5 bg-cream px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={confirm}
            className="w-full rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white"
          >
            Confirm delivery location
          </button>
        </div>
      </div>
    </div>
  );
}
