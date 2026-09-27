"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playSuccessDing } from "@/lib/sound";

export type ToastOptions = {
  message: string;
  href?: string;
  hrefLabel?: string;
  durationMs?: number;
  /** Compact cart-style toast */
  size?: "default" | "sm";
  /** Soft success chime. Default true; set false for errors / neutral notices. */
  sound?: boolean;
};

type ToastItem = ToastOptions & { id: number };

type ToastContextValue = {
  toast: (options: ToastOptions | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions | string) => {
      const normalized: ToastOptions =
        typeof options === "string" ? { message: options } : options;
      const id = ++idRef.current;
      const durationMs = normalized.durationMs ?? DEFAULT_DURATION_MS;
      const playSound = normalized.sound !== false;

      if (playSound) playSuccessDing();

      setToasts((prev) => [...prev.slice(-2), { ...normalized, id }]);

      const timer = window.setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-[5.75rem] z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((item) => {
          const sm = item.size === "sm";
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex animate-toast-in items-center gap-2 rounded-full bg-ink text-white shadow-soft ${
                sm
                  ? "max-w-[min(100%,20rem)] px-3 py-1.5 text-[12px]"
                  : "max-w-md gap-3 px-4 py-2.5 text-sm"
              }`}
            >
              <span
                aria-hidden
                className={`flex shrink-0 items-center justify-center rounded-full bg-rubies-red font-bold ${
                  sm ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1 font-medium leading-snug">
                {item.message}
              </span>
              {item.href ? (
                <Link
                  href={item.href}
                  className={
                    sm
                      ? "shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink transition hover:bg-white/90"
                      : "shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/25"
                  }
                  onClick={() => dismiss(item.id)}
                >
                  {item.hrefLabel ?? "View"}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
