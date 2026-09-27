import type { MenuItemDto, OfferDto, RestaurantPublicDto } from "@rubies/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiGet<T>(
  path: string,
  opts?: { revalidate?: number | false },
): Promise<T | null> {
  try {
    const revalidate = opts?.revalidate;
    const res = await fetch(`${API_URL}${path}`, {
      ...(revalidate === false
        ? { cache: "no-store" as const }
        : { next: { revalidate: revalidate ?? 60 } }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export function getRestaurant() {
  return apiGet<RestaurantPublicDto>("/restaurant", { revalidate: 30 });
}

export function getMenu() {
  return apiGet<MenuItemDto[]>("/menu", { revalidate: 60 });
}

export function getMenuItem(slug: string) {
  return apiGet<MenuItemDto>(`/menu/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}

export function getOffers() {
  return apiGet<OfferDto[]>("/offers", { revalidate: 30 });
}
