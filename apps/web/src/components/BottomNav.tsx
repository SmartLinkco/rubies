"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCart, useHasMounted } from "@/lib/cart";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/menu", label: "Menu", icon: MenuIcon },
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
] as const;

export function BottomNav({
  phone,
  whatsapp,
}: {
  phone: string;
  whatsapp: string;
}) {
  const pathname = usePathname();
  const { count } = useCart();
  const mounted = useHasMounted();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-cream/95 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-md items-end justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.slice(0, 2).map((tab) => (
          <NavTab
            key={tab.href}
            {...tab}
            active={pathname === tab.href}
          />
        ))}

        <div className="relative -mt-7 flex w-[4.5rem] justify-center">
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-black/[0.06]">
            <a
              href={`tel:${phone}`}
              aria-label="Call Rubies Cuisine"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-rubies-red text-white transition hover:bg-rubies-red-deep active:scale-95"
            >
              <PhoneIcon />
            </a>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp Rubies Cuisine"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe57] active:scale-95"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        {tabs.slice(2).map((tab) => (
          <NavTab
            key={tab.href}
            {...tab}
            active={pathname === tab.href || pathname.startsWith(`${tab.href}/`)}
          />
        ))}

        <Link
          href="/cart"
          className="absolute -top-3 right-4 flex h-8 min-w-8 items-center justify-center rounded-full bg-ink px-2 text-xs font-semibold text-white shadow-soft"
          aria-label="Open cart"
        >
          {mounted ? count : 0}
        </Link>
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: () => ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-14 flex-col items-center gap-1 py-1 text-[11px] font-medium transition ${
        active ? "text-rubies-red" : "text-muted"
      }`}
    >
      <Icon />
      {label}
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4h10l1 16H6L7 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19.5c1.8-3.2 4.2-4.5 7-4.5s5.2 1.3 7 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 2.8c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8l-1.2 1.2a12.5 12.5 0 0 0 5.8 5.8l1.2-1.2c.5-.5 1.3-.5 1.8 0l2 2c.5.5.5 1.3 0 1.8l-1.5 1.5c-.5.5-1.3.7-2 .4A16.8 16.8 0 0 1 4.9 6.3c-.3-.7-.1-1.5.4-2l1.3-1.5Z" />
    </svg>
  );
}
