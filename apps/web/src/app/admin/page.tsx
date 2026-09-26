"use client";

import type { AdminDashboardDto, OrderDto, OrderStatus } from "@rubies/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  pending_confirmation: "bg-amber-100 text-amber-950",
  confirmed: "bg-rubies-blue/10 text-rubies-blue",
  preparing: "bg-orange-100 text-orange-950",
  on_the_way: "bg-rubies-blue text-white",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-black/10 text-muted",
};

export default function AdminHomePage() {
  return (
    <AdminShell
      title="Today"
      subtitle="Kitchen & delivery pulse"
      action={
        <Link
          href="/admin/orders"
          className="rounded-full bg-rubies-red px-3.5 py-2 text-xs font-semibold text-white shadow-sm"
        >
          Board
        </Link>
      }
    >
      <AdminDashboard />
    </AdminShell>
  );
}

function AdminDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await clientApi.getAdminDashboard());
      setRefreshedAt(new Date());
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Failed to load dashboard", sound: false });
    }
  }, [toast]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(id);
  }, [load]);

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-[24px] bg-white/70" />
        <div className="h-20 animate-pulse rounded-[24px] bg-white/70" />
        <div className="h-40 animate-pulse rounded-[24px] bg-white/70" />
      </div>
    );
  }

  const needsAttention = data.pendingConfirmationCount > 0;

  return (
    <div className="space-y-4 pb-4">
      <section
        className={`relative overflow-hidden rounded-[24px] px-4 py-4 text-white shadow-[0_16px_36px_rgba(26,26,26,0.12)] ${
          data.isAcceptingOrders
            ? "bg-gradient-to-br from-ink via-[#243056] to-rubies-blue"
            : "bg-gradient-to-br from-[#5c3a1a] via-[#8a5a22] to-amber-700"
        }`}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
              Service status
            </p>
            <p className="mt-1 font-display text-2xl font-bold leading-tight">
              {data.isAcceptingOrders ? "Open for orders" : "Not accepting"}
            </p>
            <p className="mt-1 max-w-[16rem] text-[13px] leading-snug text-white/75">
              {data.isAcceptingOrders
                ? "Customers can place COD & pay-now orders."
                : data.closedReason ?? "Ordering is paused."}
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="shrink-0 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm"
          >
            Manage
          </Link>
        </div>
        {refreshedAt ? (
          <p className="relative mt-3 text-[11px] text-white/55">
            Auto-refreshes · last {refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        ) : null}
      </section>

      {needsAttention ? (
        <Link
          href="/admin/orders"
          className="flex items-center justify-between gap-3 rounded-[20px] bg-rubies-red px-4 py-3.5 text-white shadow-[0_12px_28px_rgba(225,6,0,0.28)] transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
              Needs action
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {data.pendingConfirmationCount} order
              {data.pendingConfirmationCount === 1 ? "" : "s"} waiting to confirm
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-rubies-red">
            Review
          </span>
        </Link>
      ) : null}

      <section className="overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-black/[0.04]">
        <div className="grid grid-cols-4 divide-x divide-black/[0.05]">
          <Metric
            label="Open"
            value={data.openOrderCount}
            href="/admin/orders"
            emphasize={data.openOrderCount > 0}
          />
          <Metric
            label="Confirm"
            value={data.pendingConfirmationCount}
            href="/admin/orders"
            emphasize={data.pendingConfirmationCount > 0}
            danger
          />
          <Metric
            label="Done"
            value={data.deliveredTodayCount}
            href="/admin/orders"
          />
          <Metric
            label="Events"
            value={data.newCateringCount}
            href="/admin/catering"
            emphasize={data.newCateringCount > 0}
          />
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-end justify-between gap-3 px-0.5">
          <div>
            <h2 className="text-base font-bold text-ink">Recent orders</h2>
            <p className="text-xs text-muted">Tap to open customer view</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-rubies-red"
          >
            Full board →
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="rounded-[24px] bg-white px-4 py-10 text-center shadow-soft ring-1 ring-black/[0.04]">
            <p className="text-sm font-medium text-ink">No orders yet</p>
            <p className="mt-1 text-xs text-muted">
              New tickets will show up here automatically.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-black/[0.04]">
            {data.recentOrders.map((order, index) => (
              <li
                key={order.id}
                className={index > 0 ? "border-t border-black/[0.05]" : ""}
              >
                <RecentOrderRow order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  href,
  emphasize,
  danger,
}: {
  label: string;
  value: number;
  href: string;
  emphasize?: boolean;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="px-2 py-3.5 text-center transition hover:bg-cream/60 active:bg-cream"
    >
      <p
        className={`font-display text-2xl font-bold leading-none ${
          danger && value > 0
            ? "text-rubies-red"
            : emphasize
              ? "text-ink"
              : "text-ink/80"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
    </Link>
  );
}

function RecentOrderRow({ order }: { order: OrderDto }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const ago = relativeTime(order.createdAt);
  const dishLine = orderSummaryLine(order);
  const payment =
    order.paymentMethod === "cod"
      ? order.paymentStatus === "paid"
        ? "COD paid"
        : "COD"
      : order.paymentStatus === "paid"
        ? "Paid"
        : "Awaiting payment";

  return (
    <Link
      href="/admin/orders"
      className="flex items-center gap-3 px-3.5 py-3.5 transition hover:bg-cream/40 active:bg-cream/70"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">
            {order.guestName ?? "Guest"}
          </p>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_TONE[order.status]}`}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted">{dishLine}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted">
          {itemCount} item{itemCount === 1 ? "" : "s"} · {payment} · {ago}
          {order.deliveryLine1 ? ` · ${order.deliveryLine1}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-ink">{formatGhs(order.totalGhs)}</p>
        <p className="mt-0.5 text-[11px] font-medium text-rubies-blue">Open</p>
      </div>
    </Link>
  );
}

function orderSummaryLine(order: OrderDto) {
  const names = order.items.map((item) =>
    item.quantity > 1 ? `${item.quantity}× ${item.name}` : item.name,
  );
  if (names.length === 0) return "No items";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} · ${names[1]}`;
  return `${names[0]} · +${names.length - 1} more`;
}

function relativeTime(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
