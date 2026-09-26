"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getExistingSubscription,
  getPushPermission,
  isIosSafari,
  isStandalonePwa,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

type Status = "loading" | "unsupported" | "off" | "on" | "denied" | "ios_install";

export function NotificationsPanel() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!pushSupported()) {
      if (isIosSafari() && !isStandalonePwa()) {
        setStatus("ios_install");
      } else {
        setStatus("unsupported");
      }
      return;
    }

    const permission = await getPushPermission();
    if (permission === "denied") {
      setStatus("denied");
      return;
    }

    const sub = await getExistingSubscription();
    setStatus(sub && permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await subscribeToPush();
      if (result.ok) {
        setMessage("Reminders on. We'll nudge you around lunch and dinner.");
        setStatus("on");
      } else if (result.reason === "denied") {
        setStatus("denied");
        setMessage("Permission blocked in browser settings.");
      } else if (result.reason === "not_configured") {
        setMessage("Push isn't configured on the server yet.");
      } else {
        setMessage("Couldn't enable notifications. Try again.");
      }
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      await unsubscribeFromPush();
      setMessage("Reminders off.");
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-[24px] bg-white p-5 shadow-soft">
      <div>
        <p className="font-semibold text-ink">Meal reminders</p>
        <p className="mt-2 text-sm text-muted">
          Opt in for lunch and dinner nudges, plus alerts when a new offer goes
          live. Tapping a notification opens the menu, an offer, or a featured
          dish.
        </p>
      </div>

      {status === "loading" ? (
        <p className="text-sm text-muted">Checking…</p>
      ) : null}

      {status === "ios_install" ? (
            <p className="rounded-2xl bg-[#FBF6F0] px-3 py-3 text-sm text-ink/80">
              On iPhone/iPad: tap Share → <strong>Add to Home Screen</strong>, open
              Rubies from the icon, then return here to enable notifications.
            </p>
      ) : null}

      {status === "unsupported" ? (
        <p className="text-sm text-muted">
          This browser doesn&apos;t support web push. Try Chrome or Safari (iOS
          16.4+ as a Home Screen app).
        </p>
      ) : null}

      {status === "denied" ? (
        <p className="text-sm text-muted">
          Notifications are blocked. Allow them for this site in your browser or
          phone settings, then come back.
        </p>
      ) : null}

      {(status === "off" || status === "on") && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {status === "on" ? "On" : "Off"}
            </p>
            <p className="text-xs text-muted">Android &amp; iOS (installed PWA)</p>
          </div>
          {status === "on" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void disable()}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-muted disabled:opacity-60"
            >
              Turn off
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void enable()}
              className="rounded-full bg-rubies-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "…" : "Turn on"}
            </button>
          )}
        </div>
      )}

      {message ? <p className="text-sm text-ink/80">{message}</p> : null}
    </div>
  );
}
