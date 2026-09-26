"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/BrandMark";

const NAV: {
  href: string;
  label: string;
  exact?: boolean;
  icon: ReactNode;
}[] = [
  { href: "/admin", label: "Home", exact: true, icon: <HomeIcon /> },
  { href: "/admin/orders", label: "Orders", icon: <OrdersIcon /> },
  { href: "/admin/menu", label: "Menu", icon: <MenuIcon /> },
  { href: "/admin/offers", label: "Offers", icon: <TagIcon /> },
  { href: "/admin/catering", label: "Events", icon: <PartyIcon /> },
  { href: "/admin/reviews", label: "Reviews", icon: <StarIcon /> },
  { href: "/admin/settings", label: "Settings", icon: <GearIcon /> },
];

export function AdminShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center px-4 text-sm text-muted">
        Loading board…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg px-4">
        <div className="mt-16 overflow-hidden rounded-[28px] bg-ink text-white shadow-soft">
          <div className="bg-gradient-to-br from-rubies-red to-rubies-red-deep px-5 pb-8 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Rubies Cuisine
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold">Ops board</h1>
            <p className="mt-2 text-sm text-white/80">
              Sign in with an admin account to run orders, menu, and settings.
            </p>
          </div>
          <div className="bg-white px-5 py-6 text-ink">
            <Link
              href="/login?next=/admin"
              className="flex w-full items-center justify-center rounded-full bg-rubies-red py-3.5 text-sm font-semibold text-white"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="mx-auto min-h-dvh max-w-lg px-4">
        <div className="mt-16 rounded-[28px] bg-white px-5 py-10 text-center shadow-soft">
          <p className="font-display text-xl font-bold text-ink">Admin only</p>
          <p className="mt-2 text-sm text-muted">
            This board is for restaurant owners and staff.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-cream-deep px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Back to storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-8">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#F7F1EA]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark
              size={44}
              className="shrink-0 drop-shadow-[0_8px_20px_rgba(225,6,0,0.28)]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-[1.45rem] font-bold leading-tight text-ink">
                  {title}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              {subtitle ? (
                <p className="truncate text-[13px] text-muted">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-black/5"
              aria-label="Open storefront"
              title="Storefront"
            >
              <StoreIcon />
            </Link>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-semibold transition ${
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "bg-white/70 text-muted ring-1 ring-black/[0.04] hover:bg-white"
                }`}
              >
                <span className={active ? "text-white" : "text-rubies-red"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="px-4 pt-4">{children}</div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h11M8 12h11M8 18h11M5 6h.01M5 12h.01M5 18h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h10M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12.5 12.5 20a2 2 0 0 1-2.8 0L4 14.3V4h10.3L20 9.7a2 2 0 0 1 0 2.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
    </svg>
  );
}

function PartyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20 9 4l4 5 7-2-5 13H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.5 14.7 9l6 .5-4.6 3.9 1.4 5.8L12 16.8 6.5 19.2l1.4-5.8L3.3 9.5l6-.5L12 3.5Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 10 5.5 4h13L21 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
