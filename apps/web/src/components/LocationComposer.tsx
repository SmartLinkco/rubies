"use client";

import { useEffect, useState } from "react";
import { LocationMapPreview } from "@/components/LocationMapPreview";
import {
  formatCoords,
  getCurrentPosition,
  reverseGeocode,
  searchPlaces,
  type DeliveryLocation,
  type PlaceSuggestion,
} from "@/lib/location";

type LocationComposerProps = {
  value: DeliveryLocation;
  onChange: (next: DeliveryLocation) => void;
  showLabelField?: boolean;
  showLandmarkField?: boolean;
  landmark?: string;
  onLandmarkChange?: (value: string) => void;
};

export function LocationComposer({
  value,
  onChange,
  showLabelField = true,
  showLandmarkField = false,
  landmark = "",
  onLandmarkChange,
}: LocationComposerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);

    return () => window.clearTimeout(handle);
  }, [query]);

  async function useGps() {
    setBusy(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      let line1 = formatCoords(lat, lng);
      try {
        line1 = await reverseGeocode(lat, lng);
      } catch {
        /* keep coordinates */
      }
      onChange({
        ...value,
        label: value.label || "Current",
        line1,
        city: value.city || "Accra",
        lat,
        lng,
        source: "gps",
      });
    } catch (err) {
      setError(
        err instanceof GeolocationPositionError
          ? geolocationMessage(err)
          : err instanceof Error
            ? err.message
            : "Could not get your location",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseSuggestion(place: PlaceSuggestion) {
    onChange({
      ...value,
      label: value.label || place.title,
      line1: place.subtitle,
      city: value.city || "Accra",
      lat: place.lat,
      lng: place.lng,
      source: "search",
    });
    setQuery("");
    setResults([]);
  }

  return (
    <div className="space-y-3">
      {showLabelField ? (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Label
          </span>
          <input
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="Home, Work, Current…"
            className="w-full rounded-card bg-white px-4 py-3 text-sm text-ink shadow-soft ring-1 ring-black/[0.04] focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
          />
        </label>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Search location
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Accra area, landmark, street…"
          className="w-full rounded-card bg-white px-4 py-3 text-sm text-ink shadow-soft ring-1 ring-black/[0.04] focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
        />
      </label>

      <button
        type="button"
        onClick={() => void useGps()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rubies-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <GpsIcon />
        {busy ? "Locating…" : "Use my current location"}
      </button>

      {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
      {searching ? <p className="text-sm text-muted">Searching…</p> : null}

      {results.length > 0 ? (
        <ul className="overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-black/[0.04]">
          {results.map((place) => (
            <li key={place.id} className="border-b border-black/[0.04] last:border-0">
              <button
                type="button"
                onClick={() => chooseSuggestion(place)}
                className="w-full px-4 py-3 text-left transition hover:bg-cream"
              >
                <p className="text-sm font-semibold text-ink">{place.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                  {place.subtitle}
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Address
        </span>
        <textarea
          value={value.line1}
          onChange={(e) =>
            onChange({ ...value, line1: e.target.value, source: "manual" })
          }
          rows={2}
          required
          placeholder="Street / area"
          className="w-full resize-none rounded-card bg-white px-4 py-3 text-sm text-ink shadow-soft ring-1 ring-black/[0.04] focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
        />
      </label>

      {showLandmarkField ? (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Landmark (optional)
          </span>
          <input
            value={landmark}
            onChange={(e) => onLandmarkChange?.(e.target.value)}
            placeholder="Near Canada Junction…"
            className="w-full rounded-card bg-white px-4 py-3 text-sm text-ink shadow-soft ring-1 ring-black/[0.04] focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
          />
        </label>
      ) : null}

      <div className="rounded-card bg-white p-4 shadow-soft ring-1 ring-black/[0.04]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Selected
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">
          {value.label.trim() || "Location"}
        </p>
        <p className="mt-1 text-sm leading-snug text-muted">{value.line1}</p>
        {value.lat != null && value.lng != null ? (
          <>
            <p className="mt-2 text-xs text-muted">
              Pin: {formatCoords(value.lat, value.lng)}
            </p>
            <LocationMapPreview
              lat={value.lat}
              lng={value.lng}
              label={value.label || value.line1}
            />
          </>
        ) : (
          <p className="mt-2 text-xs text-muted">
            No map pin yet. Use GPS or search to drop one.
          </p>
        )}
      </div>
    </div>
  );
}

function geolocationMessage(err: GeolocationPositionError) {
  if (err.code === err.PERMISSION_DENIED) {
    return "Location permission denied. Enable it in browser settings, or search instead.";
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return "Location unavailable right now. Try search.";
  }
  if (err.code === err.TIMEOUT) {
    return "Location request timed out. Try again.";
  }
  return "Could not get your location";
}

function GpsIcon() {
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
