"use client";

import type { OrderDto, OrderStatus } from "@rubies/shared";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminShell } from "@/components/AdminShell";
import { ShareDeliveryButton } from "@/components/ShareDeliveryButton";
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

/** Primary advance CTA color keyed by the *next* status being marked. */
const ADVANCE_BUTTON: Partial<Record<OrderStatus, string>> = {
  confirmed: "bg-amber-500 text-white hover:bg-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.28)]",
  preparing: "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_8px_20px_rgba(249,115,22,0.28)]",
  on_the_way: "bg-rubies-blue text-white hover:bg-rubies-blue-soft shadow-[0_8px_20px_rgba(27,58,156,0.28)]",
  delivered: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_8px_20px_rgba(5,150,105,0.28)]",
};

const CARD_HEADER: Record<OrderStatus, string> = {
  pending_confirmation: "bg-amber-50",
  confirmed: "bg-rubies-blue/[0.06]",
  preparing: "bg-orange-50",
  on_the_way: "bg-rubies-blue/10",
  delivered: "bg-emerald-50",
  cancelled: "bg-black/[0.03]",
};

const OPEN: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "preparing",
  "on_the_way",
];

function formatOrderTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
    return order.paymentStatus === "paid" ? "COD · Paid" : "COD · Unpaid";
  }
  if (order.paymentStatus === "paid") return "Paystack · Paid";
  return "Paystack";
}

export default function AdminOrdersPage() {
  return (
    <AdminShell
      title="Orders"
      subtitle="Confirm · cook · deliver"
      action={
        <Link
          href="/admin"
          className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-muted ring-1 ring-black/5"
        >
          Today
        </Link>
      }
    >
      <AdminOrders />
    </AdminShell>
  );
}

function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "done">("open");

  const load = useCallback(async () => {
    setOrders(await clientApi.listAdminOrders());
  }, []);

  useEffect(() => {
    void load().catch(() => setOrders([]));
    const id = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(id);
  }, [load]);

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
      toast({ message: err instanceof ApiRequestError ? err.message : "Update failed", sound: false });
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
      toast({ message: err instanceof ApiRequestError ? err.message : "Cancel failed", sound: false });
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(order: OrderDto) {
    setBusyId(order.id);
    try {
      await clientApi.markOrderPaid(order.orderNumber);
      await load();
      toast(`${order.orderNumber} marked paid`);
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Mark paid failed", sound: false });
    } finally {
      setBusyId(null);
    }
  }

  if (!orders) {
    return <p className="py-8 text-center text-sm text-muted">Loading orders…</p>;
  }

  return (
    <div>
      <div className="flex gap-2 rounded-[18px] bg-white p-1 shadow-soft ring-1 ring-black/[0.04]">
        <TabButton active={tab === "open"} onClick={() => setTab("open")}>
          Open · {openOrders.length}
        </TabButton>
        <TabButton active={tab === "done"} onClick={() => setTab("done")}>
          Done · {doneOrders.length}
        </TabButton>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-white px-4 py-10 text-center shadow-soft ring-1 ring-black/[0.04]">
          <p className="text-sm font-medium text-ink">No {tab} orders</p>
          <p className="mt-1 text-xs text-muted">New tickets refresh every 15 seconds.</p>
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
                onMarkPaid={() => void markPaid(order)}
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
      className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-ink text-white" : "text-muted"
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
  onMarkPaid,
}: {
  order: OrderDto;
  busy: boolean;
  onAdvance: () => void;
  onCancel: () => void;
  onMarkPaid: () => void;
}) {
  const next = NEXT_STATUS[order.status];
  const canAct = order.status !== "cancelled" && order.status !== "delivered";
  const showMarkPaid =
    order.paymentMethod === "cod" && order.paymentStatus !== "paid";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="overflow-hidden rounded-[22px] bg-white shadow-soft ring-1 ring-black/[0.04]">
      <div
        className={`flex items-start justify-between gap-3 border-b border-black/[0.04] px-4 py-3 ${CARD_HEADER[order.status]}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-ink">
              {order.guestName ?? "Guest"}
            </p>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[order.status]}`}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <Link
            href={`/orders/${order.orderNumber}`}
            className="mt-1 block truncate text-xs font-medium text-muted hover:text-rubies-blue"
          >
            {order.orderNumber}
          </Link>
          <p className="mt-1 text-[11px] text-muted">
            <span className="font-semibold text-ink">{relativeTime(order.createdAt)}</span>
            <span className="mx-1 text-black/20">·</span>
            {formatOrderTime(order.createdAt)}
          </p>
        </div>
        <p className="shrink-0 font-display text-lg font-bold text-ink">
          {formatGhs(order.totalGhs)}
        </p>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm font-medium text-ink">{itemSummary(order)}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Chip>
          <Chip>{paymentLabel(order)}</Chip>
        </div>
        <div className="mt-3 space-y-1.5">
          <MetaRow label="Phone">
            {order.guestPhone ? (
              <a href={`tel:${order.guestPhone}`} className="font-semibold text-rubies-blue">
                {order.guestPhone}
              </a>
            ) : (
              "—"
            )}
          </MetaRow>
          <MetaRow label="Deliver">{order.deliveryLine1}</MetaRow>
        </div>
      </div>

      {canAct || showMarkPaid ? (
        <div className="flex flex-wrap gap-2 border-t border-black/[0.04] bg-[#FBF8F4] px-4 py-3">
          {next && canAct ? (
            <button
              type="button"
              disabled={busy}
              onClick={onAdvance}
              className={`min-w-[8rem] flex-1 rounded-2xl px-3 py-3 text-xs font-semibold transition disabled:opacity-60 ${
                ADVANCE_BUTTON[next] ?? "bg-rubies-red text-white hover:bg-rubies-red-deep"
              }`}
            >
              {busy ? "Updating…" : `Mark ${STATUS_LABEL[next]}`}
            </button>
          ) : null}
          <ShareDeliveryButton order={order} />
          {showMarkPaid ? (
            <button
              type="button"
              disabled={busy}
              onClick={onMarkPaid}
              className="rounded-2xl bg-rubies-blue px-4 py-3 text-xs font-semibold text-white disabled:opacity-60"
            >
              Mark paid
            </button>
          ) : null}
          {canAct ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-muted ring-1 ring-black/10 disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
        </div>
      ) : order.status !== "cancelled" ? (
        <div className="flex flex-wrap gap-2 border-t border-black/[0.04] bg-[#FBF8F4] px-4 py-3">
          <ShareDeliveryButton order={order} />
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
