"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatPhoneDisplay } from "@/lib/format";

export function ProfilePanel({
  restaurantName,
  restaurantPhones,
}: {
  restaurantName: string;
  restaurantPhones: string[];
}) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="mx-4 mt-2 rounded-[28px] bg-white/80 px-4 py-16 text-center text-sm text-muted shadow-soft">
        Loading profile…
      </div>
    );
  }

  const displayName = user?.name?.trim() || (user ? "Rubies guest" : "Guest");
  const displayPhone = user?.phone
    ? formatPhoneDisplay(user.phone)
    : user?.email || restaurantPhones[0] || "";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const rows: {
    href: string;
    label: string;
    icon: ReactNode;
    locked?: boolean;
  }[] = [
    { href: "/orders", label: "My Orders", icon: <OrdersIcon /> },
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Admin board", icon: <GearIcon /> }]
      : []),
    {
      href: user ? "/profile/addresses" : "/login",
      label: "Addresses",
      icon: <PinIcon />,
      locked: !user,
    },
    {
      href: user ? "/profile/payment" : "/login",
      label: "Payment Methods",
      icon: <CardIcon />,
      locked: !user,
    },
    {
      href: "/offers",
      label: "My Coupons",
      icon: <CouponIcon />,
    },
    {
      href: "/catering",
      label: "Catering & events",
      icon: <BellIcon />,
    },
    {
      href: "/about",
      label: "About & contact",
      icon: <InfoIcon />,
    },
    {
      href: "/profile/notifications",
      label: "Notifications",
      icon: <BellIcon />,
    },
    {
      href: "/profile/help",
      label: "Help & Support",
      icon: <InfoIcon />,
    },
    {
      href: user ? "/profile/settings" : "/login",
      label: "Settings",
      icon: <GearIcon />,
      locked: !user,
    },
  ];

  return (
    <div className="relative pb-4">
      {/* Red curved header */}
      <div className="relative mx-0 overflow-hidden bg-rubies-red px-4 pb-16 pt-6 text-white">
        <div
          className="pointer-events-none absolute -left-10 top-8 h-32 w-32 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-8 -top-6 h-28 w-28 rounded-full bg-black/10"
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-white/15 text-3xl font-bold text-white ring-[3px] ring-white shadow-soft">
            {initials || "R"}
          </div>
          <h2 className="mt-4 text-[1.45rem] font-bold tracking-tight">
            {displayName}
          </h2>
          <p className="mt-1 text-sm text-white/85">{displayPhone}</p>

          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/40"
            >
              Sign out
            </button>
          ) : (
            <div className="mt-4 flex gap-2">
              <Link
                href="/login"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rubies-red"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Overlapping white sheet, full bleed to screen edges */}
      <div className="relative z-10 -mt-10">
        <div className="overflow-hidden rounded-t-[28px] bg-white shadow-[0_12px_40px_rgba(26,26,26,0.08)]">
          <ul>
            {rows.map((row, index) => (
              <li key={row.label}>
                <Link
                  href={row.href}
                  className={`flex items-center gap-3.5 px-5 py-4 transition hover:bg-cream/80 ${
                    index < rows.length - 1 ? "border-b border-black/[0.04]" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-muted">
                    {row.icon}
                  </span>
                  <span className="flex-1 text-[15px] font-medium text-ink">
                    {row.label}
                  </span>
                  {row.locked ? (
                    <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Sign in
                    </span>
                  ) : null}
                  <ChevronIcon />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 px-4 text-center text-xs text-muted">
          {restaurantName} · Closed Wednesdays
        </p>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-black/25">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7h10l1 13H6L7 7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CouponIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 11v5M12 8.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M3.5 12h2.2M18.3 12h2.2M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
