"use client";

import type { MenuItemDto } from "@rubies/shared";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";
import { formatGhs } from "@/lib/format";

const emptyForm = {
  name: "",
  description: "",
  priceGhs: "45",
  category: "Meals",
  imageUrl: "",
  available: true,
};

export default function AdminMenuPage() {
  return (
    <AdminShell title="Menu" subtitle="Add, edit, availability">
      <AdminMenu />
    </AdminShell>
  );
}

function AdminMenu() {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuItemDto[] | null>(null);
  const [editing, setEditing] = useState<MenuItemDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function load() {
    setItems(await clientApi.listAdminMenu());
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
    void clientApi
      .getAdminStorageStatus()
      .then((s) => setStorageReady(s.configured))
      .catch(() => setStorageReady(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setShowForm(true);
  }

  function openEdit(item: MenuItemDto) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      priceGhs: String(item.priceGhs),
      category: item.category,
      imageUrl: item.imageUrl ?? "",
      available: item.available,
    });
    setPreviewUrl(item.imageUrl);
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        priceGhs: Number(form.priceGhs),
        category: form.category.trim() || "Meals",
        imageUrl: form.imageUrl.trim() || null,
        available: form.available,
      };
      if (editing) {
        await clientApi.updateMenuItem(editing.id, payload);
        toast("Dish updated");
      } else {
        await clientApi.createMenuItem(payload);
        toast("Dish added");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailable(item: MenuItemDto) {
    try {
      await clientApi.updateMenuItem(item.id, { available: !item.available });
      await load();
      toast(item.available ? "Marked unavailable" : "Marked available");
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function remove(item: MenuItemDto) {
    if (!window.confirm(`Remove ${item.name}?`)) return;
    try {
      await clientApi.deleteMenuItem(item.id);
      await load();
      toast("Dish removed");
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : "Remove failed");
    }
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    if (!storageReady) {
      toast("Neon storage not configured yet");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast("Choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Keep images under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const presign = await clientApi.presignMenuUpload({
        contentType: file.type,
        filename: file.name,
      });
      const put = await fetch(presign.uploadUrl, {
        method: presign.method,
        headers: presign.headers,
        body: file,
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      setForm((f) => ({ ...f, imageUrl: presign.publicUrl }));
      setPreviewUrl(presign.displayUrl || presign.publicUrl);
      toast("Image uploaded");
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!items) {
    return <p className="py-8 text-center text-sm text-muted">Loading menu…</p>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openCreate}
        className="w-full rounded-full bg-rubies-red py-3 text-sm font-semibold text-white"
      >
        Add dish
      </button>

      {showForm ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]"
        >
          <p className="text-sm font-bold text-ink">
            {editing ? "Edit dish" : "New dish"}
          </p>
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            required
          />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            required
            multiline
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Price (GHS)"
              value={form.priceGhs}
              onChange={(v) => setForm((f) => ({ ...f, priceGhs: v }))}
              required
              type="number"
            />
            <Field
              label="Category"
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Dish photo</p>
            {previewUrl || form.imageUrl ? (
              <div className="mt-2 overflow-hidden rounded-[16px] bg-cream-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl || form.imageUrl}
                  alt=""
                  className="h-36 w-full object-cover"
                />
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-rubies-blue px-3 py-2 text-xs font-semibold text-white">
                {uploading ? "Uploading…" : storageReady ? "Upload image" : "Storage offline"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading || !storageReady}
                  onChange={(e) => {
                    void onPickImage(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.imageUrl || previewUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, imageUrl: "" }));
                    setPreviewUrl(null);
                  }}
                  className="rounded-full bg-cream-deep px-3 py-2 text-xs font-semibold text-muted"
                >
                  Remove photo
                </button>
              ) : null}
            </div>
            {!storageReady ? (
              <p className="mt-2 text-[11px] text-muted">
                Add Neon Object Storage credentials to the API `.env` to enable uploads.
              </p>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm((f) => ({ ...f, available: e.target.checked }))
              }
            />
            Available on menu
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-full bg-rubies-red py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full bg-cream-deep px-4 py-2.5 text-sm font-semibold text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.category} · {formatGhs(item.priceGhs)}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-muted">
                  {item.description}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  item.available
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-black/10 text-muted"
                }`}
              >
                {item.available ? "Live" : "Hidden"}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rubies-red ring-1 ring-rubies-red/20"
                >
                  Remove
                </button>
              </div>
              <AvailabilityToggle
                available={item.available}
                onToggle={() => void toggleAvailable(item)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AvailabilityToggle({
  available,
  onToggle,
}: {
  available: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={available ? "Hide from menu" : "Show on menu"}
      onClick={onToggle}
      className="shrink-0"
    >
      <span
        className={`relative block h-7 w-12 rounded-full transition ${
          available ? "bg-emerald-500" : "bg-black/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
            available ? "left-[1.35rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: string;
}) {
  const className =
    "mt-1 w-full rounded-[14px] border border-black/10 bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-rubies-red/40";
  return (
    <label className="block text-xs font-medium text-muted">
      {label}
      {multiline ? (
        <textarea
          value={value}
          required={required}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          type={type}
          value={value}
          required={required}
          step={type === "number" ? "0.01" : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </label>
  );
}
