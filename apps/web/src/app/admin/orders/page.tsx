"use client";

import type { OrderDto, OrderStatus } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending_confirmation: "confirmed",
  confirmed: "preparing",
  preparing: "on_the_way",
  on_the_way: "delivered",
};

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

const OPEN: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "preparing",
  "on_the_way",
];

function formatOrderTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function itemSummary(order: OrderDto) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const names = order.items.map((item) => item.name);
  if (names.length === 0) return `${count} items`;
  if (names.length === 1) return `${count}× ${names[0]}`;
  if (names.length === 2) return `${count} items · ${names[0]} + ${names[1]}`;
  return `${count} items · ${names[0]} +${names.length - 1} more`;
}

function paymentLabel(order: OrderDto) {
  if (order.paymentMethod === "cod") {
    return order.paymentStatus === "paid" ? "COD · Paid" : "COD";
  }
  if (order.paymentStatus === "paid") return "Paystack · Paid";
  return "Paystack";
}

export default function AdminOrdersPage() {
  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Admin"
      tagline="Order board"
    >
      <AdminOrders />
    </AppShell>
  );
}

function AdminOrders() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "done">("open");

  async function load() {
    const data = await clientApi.listAdminOrders();
    setOrders(data);
  }

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setOrders([]);
      return;
    }
    void load().catch(() => setOrders([]));
  }, [user]);

  const openOrders = useMemo(
    () => (orders ?? []).filter((o) => OPEN.includes(o.status)),
    [orders],
  );
  const doneOrders = useMemo(
    () =>
      (orders ?? []).filter(
        (o) => o.status === "delivered" || o.status === "cancelled",
      ),
    [orders],
  );
  const visible = tab === "open" ? openOrders : doneOrders;

  async function advance(order: OrderDto) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setBusyId(order.id);
    try {
      await clientApi.updateOrderStatus(order.orderNumber, {
        status: next,
        markCodPaid: next === "delivered" && order.paymentMethod === "cod",
      });
      await load();
      toast(`${order.orderNumber} → ${STATUS_LABEL[next]}`);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(order: OrderDto) {
    setBusyId(order.id);
    try {
      await clientApi.updateOrderStatus(order.orderNumber, {
        status: "cancelled",
        note: "Cancelled by admin",
      });
      await load();
      toast(`${order.orderNumber} cancelled`);
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
          <p className="text-sm text-muted">Admin sign-in required.</p>
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

  if (user.role !== "admin") {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
          <p className="text-sm text-muted">This board is for restaurant admins.</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-rubies-blue">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (!orders) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted">Loading orders…</div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="mt-3 flex gap-2">
        <TabButton active={tab === "open"} onClick={() => setTab("open")}>
          Open ({openOrders.length})
        </TabButton>
        <TabButton active={tab === "done"} onClick={() => setTab("done")}>
          Done ({doneOrders.length})
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
              <AdminOrderCard
                order={order}
                busy={busyId === order.id}
                onAdvance={() => void advance(order)}
                onCancel={() => void cancel(order)}
              />
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

function AdminOrderCard({
  order,
  busy,
  onAdvance,
  onCancel,
}: {
  order: OrderDto;
  busy: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const next = NEXT_STATUS[order.status];
  const canAct = order.status !== "cancelled" && order.status !== "delivered";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-black/[0.04]">
      <div className="flex items-start justify-between gap-3 border-b border-black/[0.04] bg-cream/50 px-4 py-3">
        <div className="min-w-0">
          <Link
            href={`/orders/${order.orderNumber}`}
            className="block truncate text-sm font-semibold text-ink hover:text-rubies-blue"
          >
            {order.orderNumber}
          </Link>
          <p className="mt-1 text-xs text-muted">
            <span className="font-medium text-ink">{relativeTime(order.createdAt)}</span>
            <span className="mx-1.5 text-black/20">·</span>
            {formatOrderTime(order.createdAt)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm font-medium text-ink">{itemSummary(order)}</p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Chip>
          <Chip>{paymentLabel(order)}</Chip>
          <Chip className="font-semibold text-rubies-blue">
            {formatGhs(order.totalGhs)}
          </Chip>
        </div>

        <div className="mt-3 space-y-1.5">
          <MetaRow label="Customer">
            {order.guestName ?? "Guest"}
            {order.guestPhone ? ` · ${order.guestPhone}` : ""}
          </MetaRow>
          <MetaRow label="Deliver to">{order.deliveryLine1}</MetaRow>
        </div>
      </div>

      {canAct ? (
        <div className="flex gap-2 border-t border-black/[0.04] bg-cream/40 px-4 py-3">
          {next ? (
            <button
              type="button"
              disabled={busy}
              onClick={onAdvance}
              className="flex-1 rounded-full bg-rubies-red px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-rubies-red-deep disabled:opacity-60"
            >
              {busy ? "Updating…" : `Mark ${STATUS_LABEL[next]}`}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-muted ring-1 ring-black/10 transition hover:bg-cream-deep disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </article>
  );
}

function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full bg-cream-deep px-2.5 py-1 text-[11px] font-medium text-ink/80 ${className}`}
    >
      {children}
    </span>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex gap-2 text-xs leading-snug">
      <span className="w-16 shrink-0 font-medium text-muted">{label}</span>
      <span className="min-w-0 flex-1 text-ink">{children}</span>
    </p>
  );
}
