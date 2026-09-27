"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import {
  bindInstallPromptCapture,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIosDevice,
  isStandalonePwa,
  markInstallDone,
  markInstallPromptDismissed,
  shouldOfferInstall,
  subscribeInstallPrompt,
} from "@/lib/pwa-install";
import { registerServiceWorker } from "@/lib/push";

const ONBOARD_KEY = "rubies_onboarded_v1";

type Phase = "hidden" | "offer" | "ios-steps";

/**
 * Prompts browser users to install Rubies as an app.
 * Shows before the notifications opt-in. On iOS, Install reveals Share → Home Screen steps.
 */
export function InstallAppPrompt({
  onSettled,
}: {
  onSettled?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [busy, setBusy] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    const unbind = bindInstallPromptCapture();
    void registerServiceWorker();

    const sync = () => setHasNativePrompt(Boolean(getDeferredInstallPrompt()));
    sync();
    const unsub = subscribeInstallPrompt(sync);

    let cancelled = false;
    async function maybeShow() {
      if (!shouldOfferInstall()) {
        onSettled?.();
        return;
      }

      // Wait for onboarding to finish if it's still open
      for (let i = 0; i < 40; i += 1) {
        if (cancelled) return;
        try {
          if (localStorage.getItem(ONBOARD_KEY) === "1") break;
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      await new Promise((r) => setTimeout(r, 900));
      if (cancelled) return;
      if (isStandalonePwa() || !shouldOfferInstall()) {
        onSettled?.();
        return;
      }
      setPhase("offer");
    }

    void maybeShow();
    return () => {
      cancelled = true;
      unbind();
      unsub();
    };
  }, [onSettled]);

  function settle() {
    setPhase("hidden");
    onSettled?.();
  }

  function dismiss() {
    markInstallPromptDismissed();
    settle();
  }

  async function install() {
    if (isIosDevice()) {
      setPhase("ios-steps");
      return;
    }

    const deferred = getDeferredInstallPrompt();
    if (!deferred) {
      // Desktop Safari / unsupported: show a short tip then settle
      setPhase("ios-steps");
      return;
    }

    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      clearDeferredInstallPrompt();
      if (choice.outcome === "accepted") {
        markInstallDone();
      } else {
        markInstallPromptDismissed();
      }
      settle();
    } catch {
      markInstallPromptDismissed();
      settle();
    } finally {
      setBusy(false);
    }
  }

  if (phase === "hidden") return null;

  const ios = isIosDevice();

  if (phase === "ios-steps") {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[70] flex justify-center px-3 sm:bottom-6">
        <div className="pointer-events-auto w-full max-w-md rounded-[22px] border border-black/5 bg-white/95 p-4 shadow-[0_12px_40px_rgba(40,20,10,0.18)] backdrop-blur-md">
          <div className="flex items-start gap-3">
            <BrandMark size={44} className="shrink-0 shadow-sm" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink">
                {ios ? "Add to Home Screen" : "Install Rubies"}
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-snug text-muted">
                {ios ? (
                  <>
                    <li>
                      Tap the Share button (square with an arrow) at the bottom of Safari.
                    </li>
                    <li>Scroll and tap Add to Home Screen.</li>
                    <li>Tap Add, then open Rubies from your Home Screen.</li>
                  </>
                ) : (
                  <>
                    <li>Open your browser menu (⋮ or ⋯).</li>
                    <li>Choose Install app or Add to Home screen.</li>
                    <li>Confirm, then open Rubies from your app list.</li>
                  </>
                )}
              </ol>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              markInstallPromptDismissed();
              settle();
            }}
            className="mt-4 w-full rounded-full bg-rubies-red px-3 py-2.5 text-sm font-semibold text-white"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[70] flex justify-center px-3 sm:bottom-6">
      <div className="pointer-events-auto w-full max-w-md rounded-[22px] border border-black/5 bg-white/95 p-4 shadow-[0_12px_40px_rgba(40,20,10,0.18)] backdrop-blur-md">
        <div className="flex items-start gap-3">
          <BrandMark size={44} className="shrink-0 shadow-sm" />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">Install Rubies</p>
            <p className="mt-1 text-sm leading-snug text-muted">
              Add the app to your Home Screen for faster ordering
              {ios ? " and meal reminders." : "."}
            </p>
          </div>
        </div>
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
            onClick={() => void install()}
            className="flex-1 rounded-full bg-rubies-red px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "…" : ios || !hasNativePrompt ? "How to install" : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
