import type { MenuItemDto, RestaurantPublicDto } from "@rubies/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
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
  return apiGet<RestaurantPublicDto>("/restaurant");
}

export function getMenu() {
  return apiGet<MenuItemDto[]>("/menu");
}

export function getMenuItem(slug: string) {
  return apiGet<MenuItemDto>(`/menu/${encodeURIComponent(slug)}`);
}
