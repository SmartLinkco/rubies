const PROMPT_DISMISSED_KEY = "rubies_push_prompt_dismissed";
const PROMPT_ASKED_KEY = "rubies_push_prompt_asked";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!pushSupported()) return "denied";
  return Notification.permission;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await fetch("/api-proxy/push/vapid-public-key", {
    credentials: "include",
  });
  const json = (await res.json().catch(() => null)) as {
    data?: { publicKey?: string | null; configured?: boolean };
  } | null;
  return json?.data?.publicKey ?? null;
}

export async function getExistingSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!pushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  await registerServiceWorker();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: permission === "denied" ? "denied" : "dismissed" };
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    return { ok: false, reason: "not_configured" };
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "bad_subscription" };
  }

  const res = await fetch("/api-proxy/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });

  if (!res.ok) {
    return { ok: false, reason: "server" };
  }

  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch("/api-proxy/push/unsubscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  return true;
}

export function wasPushPromptDismissed() {
  try {
    return localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPushPromptDismissed() {
  try {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
    localStorage.setItem(PROMPT_ASKED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function wasPushPromptAsked() {
  try {
    return localStorage.getItem(PROMPT_ASKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPushPromptAsked() {
  try {
    localStorage.setItem(PROMPT_ASKED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** iOS Safari only delivers web push when the site is installed to Home Screen. */
export function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}
