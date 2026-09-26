"use client";

import { brand } from "@rubies/shared";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";

const inputClass =
  "mt-1.5 w-full rounded-full border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-rubies-blue";

export default function CateringPage() {
  return (
    <AppShell
      restaurant={{
        name: brand.name,
        tagline: brand.tagline,
        phones: [...brand.phones],
        whatsapp: brand.whatsapp,
        address: brand.address,
      }}
      title="Catering & events"
      tagline="Parties, offices & bulk cooking"
    >
      <CateringForm />
    </AppShell>
  );
}

function CateringForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await clientApi.submitCatering({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        eventDate: eventDate
          ? new Date(`${eventDate}T12:00:00.000Z`).toISOString()
          : null,
        guestCount: guestCount ? Number(guestCount) : null,
        message: message.trim(),
      });
      setDone(true);
      toast(result.message);
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Could not send inquiry", sound: false });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="px-4">
        <div className="mt-6 rounded-card bg-white/90 px-5 py-10 text-center shadow-soft">
          <p className="font-display text-2xl font-bold text-ink">Inquiry sent</p>
          <p className="mt-2 text-sm text-muted">
            We will call or WhatsApp you soon about your event.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 px-4 pb-4">
      <p className="mt-2 text-sm text-muted">
        We take event orders, corporate lunches, and family bulk cooking. Tell us the
        occasion, date, guest count, and menu idea. We will follow up with a quote.
      </p>

      <Field label="Your name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Full name"
        />
      </Field>
      <Field label="Phone">
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          className={inputClass}
          placeholder="027…"
        />
      </Field>
      <Field label="Email (optional)">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@email.com"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Event date">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Guests">
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className={inputClass}
            placeholder="e.g. 40"
          />
        </Field>
      </div>
      <Field label="Details">
        <textarea
          required
          minLength={10}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1.5 w-full resize-none rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none focus:border-rubies-blue"
          placeholder="Menu ideas, venue, budget, timing…"
        />
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-rubies-red px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
