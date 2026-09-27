"use client";

import { useCallback, useEffect, useState } from "react";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import {
  getExistingSubscription,
  getPushPermission,
  isIosSafari,
  isStandalonePwa,
  markPushPromptAsked,
  markPushPromptDismissed,
  pushSupported,
  registerServiceWorker,
  subscribeToPush,
  wasPushPromptAsked,
  wasPushPromptDismissed,
} from "@/lib/push";
import { shouldOfferInstall } from "@/lib/pwa-install";

/**
 * Notifications opt-in. Waits until install prompt has settled so install shows first.
 */
export function PushOptInPrompt({
  installReady = true,
}: {
  /** False while InstallAppPrompt is still active / undecided. */
  installReady?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (!installReady) return;

    let cancelled = false;

    async function maybeShow() {
      if (!pushSupported()) return;

      void registerServiceWorker();

      if (wasPushPromptDismissed() || wasPushPromptAsked()) return;
      if (Notification.permission === "granted") {
        const sub = await getExistingSubscription();
        if (sub) {
          markPushPromptAsked();
          return;
        }
      }
      if (Notification.permission === "denied") return;

      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;

      if (isIosSafari() && !isStandalonePwa()) {
        setIosHint(true);
      }
      setVisible(true);
    }

    void maybeShow();
    return () => {
      cancelled = true;
    };
  }, [installReady]);

  if (!visible) return null;

  async function enable() {
    setBusy(true);
    try {
      if (iosHint && !isStandalonePwa()) {
        markPushPromptAsked();
        setVisible(false);
        return;
      }
      const result = await subscribeToPush();
      markPushPromptAsked();
      if (result.ok || result.reason === "denied") {
        markPushPromptDismissed();
      }
      setVisible(false);
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    markPushPromptDismissed();
    setVisible(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[60] flex justify-center px-3 sm:bottom-6">
      <div className="pointer-events-auto w-full max-w-md rounded-[22px] border border-black/5 bg-white/95 p-4 shadow-[0_12px_40px_rgba(40,20,10,0.18)] backdrop-blur-md">
        <p className="text-[15px] font-semibold text-ink">Meal reminders?</p>
        <p className="mt-1 text-sm leading-snug text-muted">
          {iosHint && !isStandalonePwa()
            ? "Open Rubies from your Home Screen, then turn on notifications from Profile."
            : "Get lunch & dinner nudges, plus new offers when we're open."}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-full border border-black/10 px-3 py-2.5 text-sm font-medium text-muted"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="flex-1 rounded-full bg-rubies-red px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {iosHint && !isStandalonePwa()
              ? "Got it"
              : busy
                ? "Enabling…"
                : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Registers SW early without showing UI — used from layout. */
export function PushServiceWorkerBoot() {
  useEffect(() => {
    void registerServiceWorker();
    if (pushSupported()) {
      void getPushPermission();
    }
  }, []);
  return null;
}

/** Coordinates install → notifications ordering. */
export function PwaPromptStack() {
  const [installReady, setInstallReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return !shouldOfferInstall();
  });

  const onInstallSettled = useCallback(() => {
    setInstallReady(true);
  }, []);

  return (
    <>
      <InstallAppPrompt onSettled={onInstallSettled} />
      <PushOptInPrompt installReady={installReady} />
    </>
  );
}
