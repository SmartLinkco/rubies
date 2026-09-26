"use client";

import type { OfferDto } from "@rubies/shared";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

const empty = {
  code: "",
  title: "",
  description: "",
  percentOff: "10",
  amountOffGhs: "",
  minOrderGhs: "0",
  expiresAt: "",
  active: true,
  mode: "percent" as "percent" | "amount",
};

export default function AdminOffersPage() {
  return (
    <AdminShell title="Offers" subtitle="Promo codes">
      <AdminOffers />
    </AdminShell>
  );
}

function AdminOffers() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<OfferDto[] | null>(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setOffers(await clientApi.listAdminOffers());
  }

  useEffect(() => {
    void load().catch(() => setOffers([]));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  }

  function openEdit(offer: OfferDto) {
    setEditingId(offer.id);
    setForm({
      code: offer.code,
      title: offer.title,
      description: offer.description,
      percentOff: offer.percentOff != null ? String(offer.percentOff) : "",
      amountOffGhs: offer.amountOffGhs != null ? String(offer.amountOffGhs) : "",
      minOrderGhs: String(offer.minOrderGhs),
      expiresAt: offer.expiresAt ? offer.expiresAt.slice(0, 10) : "",
      active: offer.active,
      mode: offer.percentOff != null ? "percent" : "amount",
    });
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim(),
        percentOff:
          form.mode === "percent" ? Number(form.percentOff) || null : null,
        amountOffGhs:
          form.mode === "amount" ? Number(form.amountOffGhs) || null : null,
        minOrderGhs: Number(form.minOrderGhs) || 0,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59.000Z`).toISOString()
          : null,
        active: form.active,
      };
      if (editingId) {
        await clientApi.updateOffer(editingId, payload);
        toast("Offer updated");
      } else {
        await clientApi.createOffer(payload);
        toast("Offer created");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Save failed", sound: false });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(offer: OfferDto) {
    try {
      await clientApi.updateOffer(offer.id, { active: !offer.active });
      await load();
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Update failed", sound: false });
    }
  }

  if (!offers) {
    return <p className="py-8 text-center text-sm text-muted">Loading offers…</p>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openCreate}
        className="w-full rounded-full bg-rubies-red py-3 text-sm font-semibold text-white"
      >
        New offer
      </button>

      {showForm ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]"
        >
          <Input label="Code" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} required />
          <Input label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
          <Input label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} required />
          <div className="flex gap-2">
            {(["percent", "amount"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode }))}
                className={`flex-1 rounded-full py-2 text-xs font-semibold capitalize ${
                  form.mode === mode ? "bg-rubies-blue text-white" : "bg-cream-deep text-muted"
                }`}
              >
                {mode === "percent" ? "% off" : "Amount off"}
              </button>
            ))}
          </div>
          {form.mode === "percent" ? (
            <Input label="Percent off" value={form.percentOff} onChange={(v) => setForm((f) => ({ ...f, percentOff: v }))} type="number" />
          ) : (
            <Input label="Amount off (GHS)" value={form.amountOffGhs} onChange={(v) => setForm((f) => ({ ...f, amountOffGhs: v }))} type="number" />
          )}
          <Input label="Min order (GHS)" value={form.minOrderGhs} onChange={(v) => setForm((f) => ({ ...f, minOrderGhs: v }))} type="number" />
          <Input label="Expires (optional)" value={form.expiresAt} onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))} type="date" />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="flex-1 rounded-full bg-rubies-red py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full bg-cream-deep px-4 py-2.5 text-sm font-semibold text-muted">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3">
        {offers.map((offer) => (
          <li key={offer.id} className="rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{offer.title}</p>
                <p className="mt-0.5 text-xs font-bold tracking-wide text-rubies-red">{offer.code}</p>
                <p className="mt-1 text-xs text-muted">
                  {offer.percentOff != null
                    ? `${offer.percentOff}% off`
                    : `${formatGhs(offer.amountOffGhs ?? 0)} off`}
                  {offer.minOrderGhs > 0 ? ` · min ${formatGhs(offer.minOrderGhs)}` : ""}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${offer.active ? "bg-emerald-100 text-emerald-900" : "bg-black/10 text-muted"}`}>
                {offer.active ? "Active" : "Off"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => openEdit(offer)} className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink">
                Edit
              </button>
              <button type="button" onClick={() => void toggleActive(offer)} className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink">
                {offer.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[14px] border border-black/10 bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-rubies-red/40"
      />
    </label>
  );
}
