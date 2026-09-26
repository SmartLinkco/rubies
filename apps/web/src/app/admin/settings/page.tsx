"use client";

import type { RestaurantAdminDto } from "@rubies/shared";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Settings" subtitle="Fees, hours, alerts">
      <AdminSettings />
    </AdminShell>
  );
}

function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<RestaurantAdminDto | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void clientApi
      .getAdminSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setBusy(true);
    try {
      const updated = await clientApi.updateAdminSettings({
        name: settings.name,
        tagline: settings.tagline,
        phones: settings.phones,
        whatsapp: settings.whatsapp,
        address: settings.address,
        deliveryFeeMode: settings.deliveryFeeMode,
        fixedDeliveryFeeGhs: settings.fixedDeliveryFeeGhs,
        distanceBaseFeeGhs: settings.distanceBaseFeeGhs,
        distancePerKmGhs: settings.distancePerKmGhs,
        maxDeliveryKm: settings.maxDeliveryKm,
        closedWeekdays: settings.closedWeekdays,
        forceClosed: settings.forceClosed,
        forceOpen: settings.forceOpen,
        notifySmsOnNewOrder: settings.notifySmsOnNewOrder,
        notifyEmailOnNewOrder: settings.notifyEmailOnNewOrder,
        ownerEmails: settings.ownerEmails,
        ownerPhones: settings.ownerPhones,
      });
      setSettings(updated);
      toast("Settings saved");
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Save failed", sound: false });
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return <p className="py-8 text-center text-sm text-muted">Loading settings…</p>;
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-5 pb-6">
      <Section title="Ordering status">
        <p
          className={`rounded-[14px] px-3 py-2 text-sm ${
            settings.isAcceptingOrders
              ? "bg-emerald-50 text-emerald-900"
              : "bg-amber-50 text-amber-950"
          }`}
        >
          {settings.isAcceptingOrders
            ? "Currently accepting orders"
            : settings.closedReason ?? "Closed"}
        </p>
        <Toggle
          label="Force closed"
          checked={settings.forceClosed}
          onChange={(v) =>
            setSettings((s) =>
              s ? { ...s, forceClosed: v, forceOpen: v ? false : s.forceOpen } : s,
            )
          }
        />
        <Toggle
          label="Force open (override closed days)"
          checked={settings.forceOpen}
          onChange={(v) =>
            setSettings((s) =>
              s ? { ...s, forceOpen: v, forceClosed: v ? false : s.forceClosed } : s,
            )
          }
        />
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Closed weekdays</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const on = settings.closedWeekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setSettings((s) => {
                      if (!s) return s;
                      const set = new Set(s.closedWeekdays);
                      if (on) set.delete(day.value);
                      else set.add(day.value);
                      return { ...s, closedWeekdays: [...set].sort() };
                    })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    on ? "bg-rubies-red text-white" : "bg-cream-deep text-muted"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Delivery fees">
        <div className="flex gap-2">
          {(["fixed", "distance"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() =>
                setSettings((s) => (s ? { ...s, deliveryFeeMode: mode } : s))
              }
              className={`flex-1 rounded-full py-2 text-xs font-semibold capitalize ${
                settings.deliveryFeeMode === mode
                  ? "bg-rubies-blue text-white"
                  : "bg-cream-deep text-muted"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {settings.deliveryFeeMode === "fixed" ? (
          <NumberField
            label="Fixed fee (GHS)"
            value={settings.fixedDeliveryFeeGhs}
            onChange={(v) =>
              setSettings((s) => (s ? { ...s, fixedDeliveryFeeGhs: v } : s))
            }
          />
        ) : (
          <>
            <NumberField
              label="Base fee (GHS)"
              value={settings.distanceBaseFeeGhs}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, distanceBaseFeeGhs: v } : s))
              }
            />
            <NumberField
              label="Per km (GHS)"
              value={settings.distancePerKmGhs}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, distancePerKmGhs: v } : s))
              }
            />
            <NumberField
              label="Max radius (km)"
              value={settings.maxDeliveryKm}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, maxDeliveryKm: v } : s))
              }
            />
          </>
        )}
      </Section>

      <Section title="Notifications">
        <Toggle
          label="SMS on new order"
          checked={settings.notifySmsOnNewOrder}
          onChange={(v) =>
            setSettings((s) => (s ? { ...s, notifySmsOnNewOrder: v } : s))
          }
        />
        <Toggle
          label="Email on new order"
          checked={settings.notifyEmailOnNewOrder}
          onChange={(v) =>
            setSettings((s) => (s ? { ...s, notifyEmailOnNewOrder: v } : s))
          }
        />
        <TextField
          label="Owner emails (comma-separated)"
          value={settings.ownerEmails.join(", ")}
          onChange={(v) =>
            setSettings((s) =>
              s
                ? {
                    ...s,
                    ownerEmails: v
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }
                : s,
            )
          }
        />
        <TextField
          label="Owner phones (comma-separated)"
          value={settings.ownerPhones.join(", ")}
          onChange={(v) =>
            setSettings((s) =>
              s
                ? {
                    ...s,
                    ownerPhones: v
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }
                : s,
            )
          }
        />
      </Section>

      <Section title="Restaurant profile">
        <TextField
          label="Name"
          value={settings.name}
          onChange={(v) => setSettings((s) => (s ? { ...s, name: v } : s))}
        />
        <TextField
          label="Tagline"
          value={settings.tagline}
          onChange={(v) => setSettings((s) => (s ? { ...s, tagline: v } : s))}
        />
        <TextField
          label="WhatsApp"
          value={settings.whatsapp}
          onChange={(v) => setSettings((s) => (s ? { ...s, whatsapp: v } : s))}
        />
        <TextField
          label="Phones (comma-separated)"
          value={settings.phones.join(", ")}
          onChange={(v) =>
            setSettings((s) =>
              s
                ? {
                    ...s,
                    phones: v
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }
                : s,
            )
          }
        />
        <TextField
          label="Address"
          value={settings.address}
          onChange={(v) => setSettings((s) => (s ? { ...s, address: v } : s))}
        />
      </Section>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-rubies-red py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-ink">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[14px] border border-black/10 bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-rubies-red/40"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-[14px] border border-black/10 bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-rubies-red/40"
      />
    </label>
  );
}
