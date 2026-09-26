"use client";

import type { OrderDto, OrderStatus } from "@rubies/shared";
import { brand } from "@rubies/shared";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

const STATUS_STEPS: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "Pending confirmation",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function paystackReferenceFromOrderNumber(orderNumber: string) {
  return orderNumber.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell
          restaurant={{
            name: brand.name,
            tagline: brand.tagline,
            phones: [...brand.phones],
            whatsapp: brand.whatsapp,
            address: brand.address,
          }}
          title="Order"
          tagline="Loading…"
        >
          <div className="px-4 py-10 text-center text-sm text-muted">Loading order…</div>
        </AppShell>
      }
    >
      <OrderDetailInner />
    </Suspense>
  );
}

function OrderDetailInner() {
  const params = useParams<{ orderNumber: string }>();
  const search = useSearchParams();
  const { toast } = useToast();
  const orderNumber = decodeURIComponent(params.orderNumber);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const paymentAttempted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await clientApi.getOrder(orderNumber);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError ? err.message : "Order not found",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  useEffect(() => {
    if (!order || paymentAttempted.current) return;
    const mockPay = search.get("mockPay") === "1";
    const paid = search.get("paid") === "1";
    if (!mockPay && !paid) return;
    if (order.paymentStatus === "paid") return;
    if (order.paymentMethod !== "paystack") return;

    paymentAttempted.current = true;
    setCompleting(true);
    const reference = paystackReferenceFromOrderNumber(order.orderNumber);
    void clientApi
      .completePaystack(reference)
      .then((updated) => {
        setOrder(updated);
        toast("Payment confirmed");
      })
      .catch((err) => {
        toast(
          err instanceof ApiRequestError
            ? err.message
            : "Could not confirm payment",
        );
      })
      .finally(() => setCompleting(false));
  }, [order, search, toast]);

  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Order"
      tagline={order?.orderNumber ?? "Status"}
    >
      <div className="px-4 pb-4">
        {error ? (
          <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
            <p className="text-sm text-muted">{error}</p>
            <Link
              href="/orders"
              className="mt-4 inline-flex text-sm font-semibold text-rubies-blue"
            >
              Back to orders
            </Link>
          </div>
        ) : !order ? (
          <div className="mt-6 rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
            Loading order…
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <section className="rounded-card bg-white/90 p-4 text-center shadow-soft">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {order.paymentStatus === "paid"
                  ? "Payment received"
                  : order.paymentMethod === "cod"
                    ? "Cash on delivery"
                    : completing
                      ? "Confirming payment…"
                      : "Awaiting payment"}
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink">
                {STATUS_LABEL[order.status]}
              </h1>
              <p className="mt-1 text-sm text-muted">{order.orderNumber}</p>
            </section>

            <section className="rounded-card bg-white/90 p-4 shadow-soft">
              <h2 className="text-sm font-semibold text-ink">Status</h2>
              <ol className="mt-4 space-y-3">
                {STATUS_STEPS.map((step, index) => {
                  const currentIndex = STATUS_STEPS.indexOf(
                    order.status === "cancelled"
                      ? "pending_confirmation"
                      : order.status,
                  );
                  const done = order.status !== "cancelled" && index <= currentIndex;
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-rubies-red text-white"
                            : "bg-cream-deep text-muted"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <span
                        className={`text-sm ${done ? "font-semibold text-ink" : "text-muted"}`}
                      >
                        {STATUS_LABEL[step]}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {order.status === "cancelled" ? (
                <p className="mt-3 text-sm text-rubies-red">This order was cancelled.</p>
              ) : null}
            </section>

            <section className="rounded-card bg-white/90 p-4 shadow-soft">
              <h2 className="text-sm font-semibold text-ink">Items</h2>
              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium text-rubies-blue">
                      {formatGhs(item.unitPriceGhs * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-black/5 pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatGhs(order.subtotalGhs)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span>{formatGhs(order.deliveryFeeGhs)}</span>
                </div>
                <div className="flex justify-between font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatGhs(order.totalGhs)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-card bg-white/90 p-4 shadow-soft">
              <h2 className="text-sm font-semibold text-ink">Deliver to</h2>
              <p className="mt-2 text-sm text-ink">{order.deliveryLine1}</p>
              {order.deliveryLandmark ? (
                <p className="text-xs text-muted">{order.deliveryLandmark}</p>
              ) : null}
              <p className="text-xs text-muted">{order.deliveryCity}</p>
            </section>

            <Link
              href="/menu"
              className="flex w-full items-center justify-center rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white"
            >
              Order again
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
