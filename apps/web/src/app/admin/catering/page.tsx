"use client";

import type { CateringInquiryDto } from "@rubies/shared";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";

export default function AdminCateringPage() {
  return (
    <AdminShell title="Catering" subtitle="Inquiry inbox">
      <AdminCatering />
    </AdminShell>
  );
}

function AdminCatering() {
  const { toast } = useToast();
  const [items, setItems] = useState<CateringInquiryDto[] | null>(null);

  async function load() {
    setItems(await clientApi.listAdminCatering());
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function setStatus(id: string, status: "new" | "contacted" | "done") {
    try {
      await clientApi.updateCateringStatus(id, status);
      await load();
      toast(`Marked ${status}`);
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Update failed", sound: false });
    }
  }

  if (!items) {
    return <p className="py-8 text-center text-sm text-muted">Loading inbox…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
        No catering inquiries yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {item.phone}
                {item.email ? ` · ${item.email}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-cream-deep px-2.5 py-1 text-[11px] font-semibold capitalize text-ink">
              {item.status}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{item.message}</p>
          <p className="mt-2 text-xs text-muted">
            {item.guestCount ? `${item.guestCount} guests · ` : ""}
            {item.eventDate
              ? `Event ${item.eventDate.slice(0, 10)} · `
              : ""}
            {new Date(item.createdAt).toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.status !== "contacted" ? (
              <button
                type="button"
                onClick={() => void setStatus(item.id, "contacted")}
                className="rounded-full bg-rubies-blue px-3 py-1.5 text-xs font-semibold text-white"
              >
                Contacted
              </button>
            ) : null}
            {item.status !== "done" ? (
              <button
                type="button"
                onClick={() => void setStatus(item.id, "done")}
                className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink"
              >
                Done
              </button>
            ) : null}
            <a
              href={`tel:${item.phone}`}
              className="rounded-full bg-rubies-red px-3 py-1.5 text-xs font-semibold text-white"
            >
              Call
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
