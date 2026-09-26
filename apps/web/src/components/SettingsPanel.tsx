"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";

export function SettingsPanel() {
  const { user, loading, setUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredPayment, setPreferredPayment] = useState<"cod" | "paystack">("paystack");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setPreferredPayment(user.preferredPayment);
  }, [user]);

  if (loading) {
    return <p className="px-4 text-sm text-muted">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="px-4">
        <p className="text-sm text-muted">Sign in to edit your settings.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await clientApi.updateProfile({
        name,
        phone: phone || null,
        preferredPayment,
      });
      setUser(data.user);
      setMessage("Settings saved");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveProfile} className="mx-4 space-y-3 rounded-[24px] bg-white p-4 shadow-soft">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-soft bg-cream px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-soft bg-cream px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Preferred payment
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["paystack", "Pay now"],
              ["cod", "Cash on delivery"],
            ] as const
          ).map(([value, labelText]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreferredPayment(value)}
              className={`rounded-soft px-3 py-2.5 text-left text-sm font-medium ${
                preferredPayment === value ? "bg-rubies-red text-white" : "bg-cream text-ink"
              }`}
            >
              {labelText}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-sm text-rubies-red">{error}</p> : null}
      {message ? <p className="text-sm text-rubies-blue">{message}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-rubies-red px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
