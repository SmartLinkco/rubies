"use client";

import type { AddressDto } from "@rubies/shared";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LocationComposer } from "@/components/LocationComposer";
import { LocationMapPreview } from "@/components/LocationMapPreview";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatCoords, type DeliveryLocation } from "@/lib/location";

const emptyDraft = (): DeliveryLocation => ({
  label: "Home",
  line1: "",
  city: "Accra",
  lat: null,
  lng: null,
  source: "manual",
});

export function AddressesPanel() {
  const { user, loading } = useAuth();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeliveryLocation>(emptyDraft);
  const [landmark, setLandmark] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void clientApi
      .listAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [user]);

  if (loading) {
    return <p className="px-4 text-sm text-muted">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="px-4">
        <p className="text-sm text-muted">Sign in to manage delivery addresses.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function addAddress(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (draft.line1.trim().length < 3) {
      setError("Add an address via search, GPS, or type one in.");
      return;
    }
    setSaving(true);
    try {
      const address = await clientApi.createAddress({
        label: draft.label.trim() || "Home",
        line1: draft.line1.trim(),
        landmark: landmark || null,
        city: draft.city || "Accra",
        lat: draft.lat,
        lng: draft.lng,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [address, ...prev]);
      setDraft(emptyDraft());
      setLandmark("");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not add address",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id: string) {
    try {
      await clientApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not remove address",
      );
    }
  }

  return (
    <div className="space-y-4 px-4">
      <ul className="overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-black/[0.03]">
        {addresses.map((address, i) => (
          <li
            key={address.id}
            className={`px-4 py-4 ${
              i < addresses.length - 1 ? "border-b border-black/[0.04]" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {address.label}
                  {address.isDefault ? (
                    <span className="ml-2 text-xs font-medium text-rubies-blue">
                      Default
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {address.line1}
                  {address.landmark ? ` · ${address.landmark}` : ""}
                </p>
                <p className="text-sm text-muted">{address.city}</p>
                {address.lat != null && address.lng != null ? (
                  <p className="mt-1 text-xs text-muted">
                    Pin: {formatCoords(address.lat, address.lng)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void removeAddress(address.id)}
                className="text-xs font-medium text-rubies-red"
              >
                Remove
              </button>
            </div>
            {address.lat != null && address.lng != null ? (
              <LocationMapPreview
                lat={address.lat}
                lng={address.lng}
                label={address.label}
              />
            ) : null}
          </li>
        ))}
        {!addresses.length ? (
          <li className="px-4 py-8 text-center text-sm text-muted">
            No saved addresses yet.
          </li>
        ) : null}
      </ul>

      <form
        onSubmit={addAddress}
        className="space-y-3 rounded-[24px] bg-cream p-4 shadow-soft ring-1 ring-black/[0.03]"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Add address
        </p>
        <LocationComposer
          value={draft}
          onChange={setDraft}
          showLandmarkField
          landmark={landmark}
          onLandmarkChange={setLandmark}
        />
        {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-rubies-red px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
      </form>
    </div>
  );
}
