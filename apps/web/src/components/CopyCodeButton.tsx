"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function CopyCodeButton({
  code,
  className = "",
  variant = "light",
}: {
  code: string;
  className?: string;
  variant?: "light" | "dark" | "red";
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const styles =
    variant === "dark"
      ? "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
      : variant === "red"
        ? "bg-rubies-red text-white hover:bg-rubies-red-deep"
        : "bg-cream-deep text-ink ring-1 ring-black/5 hover:bg-cream";

  return (
    <button
      type="button"
      aria-label={`Copy promo code ${code}`}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast(`${code} copied`);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          toast(`Code: ${code}`);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${styles} ${className}`}
    >
      <CopyIcon />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
