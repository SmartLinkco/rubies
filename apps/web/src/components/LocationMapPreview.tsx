"use client";

import { useState } from "react";
import {
  externalMapsUrl,
  formatCoords,
  staticMapUrl,
} from "@/lib/location";

export function LocationMapPreview({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const mapsHref = externalMapsUrl(lat, lng, label);

  return (
    <div className="mt-3 overflow-hidden rounded-soft ring-1 ring-black/5">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staticMapUrl(lat, lng)}
          alt={`Map pin near ${label || formatCoords(lat, lng)}`}
          className="h-44 w-full object-cover bg-[#d9e7f2]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-44 flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#dceaf5] to-[#c5d9ea] px-4 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rubies-red text-white shadow-soft">
            <PinGlyph />
          </span>
          <p className="text-sm font-semibold text-ink">Pinned location</p>
          <p className="text-xs text-muted">{formatCoords(lat, lng)}</p>
        </div>
      )}
      <a
        href={mapsHref}
        target="_blank"
        rel="noreferrer"
        className="block bg-white px-3 py-2 text-center text-xs font-semibold text-rubies-blue"
      >
        Open in Maps
      </a>
    </div>
  );
}

function PinGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
    </svg>
  );
}
