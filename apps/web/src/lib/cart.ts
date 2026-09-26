"use client";

import type { CartDto } from "@rubies/shared";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { clientApi } from "@/lib/client-api";

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  priceGhs: number;
  quantity: number;
};

const STORAGE_KEY = "rubies_cart_v1";
const EMPTY_CART: CartLine[] = [];
const listeners = new Set<() => void>();

let cachedCart: CartLine[] = EMPTY_CART;
let hasLoaded = false;

function emit() {
  listeners.forEach((l) => l());
}

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY_CART;
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

function ensureLoaded() {
  if (hasLoaded || typeof window === "undefined") return;
  cachedCart = parseCart(localStorage.getItem(STORAGE_KEY));
  hasLoaded = true;
}

function readCart(): CartLine[] {
  ensureLoaded();
  return cachedCart;
}

function writeCart(lines: CartLine[], { persistLocal = true } = {}) {
  cachedCart = lines.length > 0 ? lines : EMPTY_CART;
  hasLoaded = true;
  if (persistLocal) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedCart));
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureLoaded();

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedCart = parseCart(event.newValue);
    emit();
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function fromServerCart(cart: CartDto): CartLine[] {
  if (!cart.items.length) return EMPTY_CART;
  return cart.items.map((item) => ({
    id: item.menuItemId,
    slug: item.slug,
    name: item.name,
    priceGhs: item.priceGhs,
    quantity: item.quantity,
  }));
}

export function applyServerCart(cart: CartDto) {
  writeCart(fromServerCart(cart));
}

export async function pushLocalCartToServer() {
  ensureLoaded();
  const local = readCart();
  // Replace (not merge) so repeated hydrate/checkout pushes do not inflate qty
  return clientApi.replaceCart(
    local.map((line) => ({
      menuItemId: line.id,
      quantity: line.quantity,
    })),
  );
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, readCart, getServerSnapshot);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.priceGhs * line.quantity,
    0,
  );

  const addItem = useCallback(
    async (item: Omit<CartLine, "quantity">, quantity = 1) => {
      const current = readCart();
      const existing = current.find((line) => line.id === item.id);
      const nextQty = (existing?.quantity ?? 0) + quantity;
      const optimistic = existing
        ? current.map((line) =>
            line.id === item.id ? { ...line, quantity: nextQty } : line,
          )
        : [...current, { ...item, quantity }];
      writeCart(optimistic);

      try {
        const cart = await clientApi.putCartItem(item.id, nextQty);
        applyServerCart(cart);
      } catch {
        /* keep optimistic local cart if API unavailable */
      }
    },
    [],
  );

  const setQuantity = useCallback(async (id: string, quantity: number) => {
    const current = readCart();
    const optimistic =
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity } : line));
    writeCart(optimistic);

    try {
      const cart = await clientApi.putCartItem(id, Math.max(0, quantity));
      applyServerCart(cart);
    } catch {
      /* keep optimistic */
    }
  }, []);

  const clear = useCallback(async () => {
    const current = readCart();
    writeCart([]);
    try {
      await Promise.all(
        current.map((line) => clientApi.putCartItem(line.id, 0)),
      );
      const cart = await clientApi.getCart();
      applyServerCart(cart);
    } catch {
      /* keep cleared local */
    }
  }, []);

  return { lines, count, subtotal, addItem, setQuantity, clear };
}

export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
