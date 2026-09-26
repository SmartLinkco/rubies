export type DeliveryLocation = {
  label: string;
  line1: string;
  landmark?: string | null;
  city?: string;
  lat: number | null;
  lng: number | null;
  source: "default" | "gps" | "search" | "saved" | "manual";
};

export const LOCATION_STORAGE_KEY = "rubies_delivery_location_v1";

export const DEFAULT_LOCATION: DeliveryLocation = {
  label: "Home",
  line1: "Rubies Cuisine, MMX5+9C2, Achiaman",
  city: "Accra",
  lat: 5.683,
  lng: -0.266,
  source: "default",
};

export type PlaceSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
};

export function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function readStoredLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeliveryLocation;
  } catch {
    return null;
  }
}

export function writeStoredLocation(location: DeliveryLocation) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    });
  });
}

/** Reverse geocode via OpenStreetMap Nominatim (no API key). */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Could not look up that location");
  const data = (await res.json()) as {
    display_name?: string;
    name?: string;
    address?: Record<string, string>;
  };

  if (data.display_name) return data.display_name;

  const a = data.address ?? {};
  const parts = [
    a.road || a.neighbourhood || a.suburb,
    a.city || a.town || a.village || a.county,
    a.state,
  ].filter(Boolean);
  return parts.join(", ") || formatCoords(lat, lng);
}

/** Search places via Nominatim, biased to Ghana. */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "gh");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Search failed");

  const data = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
  }>;

  return data.map((item) => ({
    id: String(item.place_id),
    title: item.name || item.display_name.split(",")[0] || "Place",
    subtitle: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

export function staticMapUrl(lat: number, lng: number, width = 600, height = 240) {
  // Plain PNG tiles (no WebGL iframe). Uses OSM static map service.
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "15",
    size: `${width}x${height}`,
    maptype: "mapnik",
    markers: `${lat},${lng},red-pushpin`,
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}

export function externalMapsUrl(lat: number, lng: number, label?: string) {
  const query = label?.trim()
    ? encodeURIComponent(`${label} @ ${lat},${lng}`)
    : `${lat},${lng}`;
  return `https://www.google.com/maps?q=${query}`;
}

export function googleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
}
