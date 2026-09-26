"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

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

function writeCart(lines: CartLine[]) {
  cachedCart = lines.length > 0 ? lines : EMPTY_CART;
  hasLoaded = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedCart));
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

export function useCart() {
  const lines = useSyncExternalStore(subscribe, readCart, getServerSnapshot);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.priceGhs * line.quantity,
    0,
  );

  const addItem = useCallback(
    (item: Omit<CartLine, "quantity">, quantity = 1) => {
      const current = readCart();
      const existing = current.find((line) => line.id === item.id);
      if (existing) {
        writeCart(
          current.map((line) =>
            line.id === item.id
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          ),
        );
      } else {
        writeCart([...current, { ...item, quantity }]);
      }
    },
    [],
  );

  const setQuantity = useCallback((id: string, quantity: number) => {
    const current = readCart();
    if (quantity <= 0) {
      writeCart(current.filter((line) => line.id !== id));
      return;
    }
    writeCart(
      current.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  return { lines, count, subtotal, addItem, setQuantity, clear };
}

export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
