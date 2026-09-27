const INSTALL_DISMISSED_KEY = "rubies_install_prompt_dismissed";
const INSTALL_DONE_KEY = "rubies_install_prompt_done";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
  listeners.forEach((fn) => fn());
}

export function subscribeInstallPrompt(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Call once from app boot to capture Chrome/Android install events. */
export function bindInstallPromptCapture() {
  if (typeof window === "undefined") return () => undefined;

  const onBeforeInstall = (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  };

  const onInstalled = () => {
    deferredPrompt = null;
    markInstallDone();
    listeners.forEach((fn) => fn());
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function wasInstallPromptDismissed() {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markInstallPromptDismissed() {
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function wasInstallDone() {
  try {
    return localStorage.getItem(INSTALL_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markInstallDone() {
  try {
    localStorage.setItem(INSTALL_DONE_KEY, "1");
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

/** True when we should still ask the user to install. */
export function shouldOfferInstall() {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return false;
  if (wasInstallDone() || wasInstallPromptDismissed()) return false;
  return true;
}
