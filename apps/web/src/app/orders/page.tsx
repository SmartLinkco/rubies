"use client";

import type { OrderDto, OrderStatus } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_confirmation: "bg-amber-100 text-amber-900",
  confirmed: "bg-rubies-blue/10 text-rubies-blue",
  preparing: "bg-orange-100 text-orange-900",
  on_the_way: "bg-rubies-blue text-white",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-black/10 text-muted",
};

const ACTIVE: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "preparing",
  "on_the_way",
];

function paymentLabel(order: OrderDto) {
  if (order.paymentMethod === "cod") {
    return order.paymentStatus === "paid" ? "COD · Paid" : "Cash on delivery";
  }
  if (order.paymentStatus === "paid") return "Paid";
  if (order.paymentStatus === "failed") return "Payment failed";
  return "Awaiting payment";
}

function itemSummary(order: OrderDto) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const names = order.items.map((item) => item.name);
  if (names.length === 0) return `${count} items`;
  if (names.length === 1) return `${count}× ${names[0]}`;
  if (names.length === 2) return `${count} items · ${names[0]} + ${names[1]}`;
  return `${count} items · ${names[0]} +${names.length - 1} more`;
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Orders"
      tagline="Track and reorder"
    >
      <OrdersList />
    </AppShell>
  );
}

function OrdersList() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    void clientApi
      .listMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  const active = useMemo(
    () => (orders ?? []).filter((o) => ACTIVE.includes(o.status)),
    [orders],
  );
  const past = useMemo(
    () =>
      (orders ?? []).filter(
        (o) => o.status === "delivered" || o.status === "cancelled",
      ),
    [orders],
  );
  const visible = tab === "active" ? active : past;

  if (loading || orders === null) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
          Loading orders…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
          <p className="text-sm text-muted">
            Sign in to see your order history. Guest orders still work — keep your
            order number from the confirmation screen.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
          <p className="text-sm text-muted">No orders yet.</p>
          <Link
            href="/menu"
            className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="mt-4 flex gap-2">
        <TabButton active={tab === "active"} onClick={() => setTab("active")}>
          Active ({active.length})
        </TabButton>
        <TabButton active={tab === "past"} onClick={() => setTab("past")}>
          Past ({past.length})
        </TabButton>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
          No {tab} orders.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-rubies-red text-white" : "bg-cream-deep text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function OrderCard({ order }: { order: OrderDto }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/orders/${order.orderNumber}`}
      className="block rounded-card bg-white/90 p-4 shadow-soft ring-1 ring-black/[0.04] transition hover:ring-rubies-blue/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{order.orderNumber}</p>
          <p className="mt-0.5 text-xs text-muted">{formatOrderDate(order.createdAt)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium text-ink">{itemSummary(order)}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatChip>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </StatChip>
        <StatChip>{paymentLabel(order)}</StatChip>
        <StatChip>Delivery {formatGhs(order.deliveryFeeGhs)}</StatChip>
      </div>

      <p className="mt-2 truncate text-xs text-muted">{order.deliveryLine1}</p>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="text-xs font-medium text-muted">Total</span>
        <span className="text-sm font-semibold text-rubies-blue">
          {formatGhs(order.totalGhs)}
        </span>
      </div>
    </Link>
  );
}

function StatChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-cream-deep px-2.5 py-1 text-[11px] font-medium text-ink/80">
      {children}
    </span>
  );
}
