"use client";

import type { MenuItemDto } from "@rubies/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DishVisual } from "@/components/DishVisual";
import { categoryForSlug } from "@/lib/dish";
import { formatGhs } from "@/lib/format";

export function MenuExplorer({
  items,
  mode = "grid",
}: {
  items: MenuItemDto[];
  mode?: "grid" | "list";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(items.map((item) => categoryForSlug(item.slug, item.category)));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = items.filter((item) => {
    const cat = categoryForSlug(item.slug, item.category);
    const matchesCategory = category === "All" || cat === category;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search menu</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jollof, fufu, chicken…"
          className="w-full rounded-card border-0 bg-white/90 px-4 py-3.5 text-sm text-ink shadow-soft ring-1 ring-black/[0.04] placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-rubies-red/30"
        />
      </label>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-rubies-red text-white shadow-soft"
                  : "bg-white/80 text-muted ring-1 ring-black/[0.05]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {mode === "grid" ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {filtered.map((item, i) => (
            <Link
              key={item.id}
              href={`/menu/${item.slug}`}
              className="group animate-rise overflow-hidden rounded-card bg-white/85 shadow-soft ring-1 ring-black/[0.04]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <DishVisual slug={item.slug} className="aspect-[4/3]" compact />
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-ink group-hover:text-rubies-red">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-rubies-blue">
                  {formatGhs(item.priceGhs)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((item, i) => (
            <li key={item.id} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <Link
                href={`/menu/${item.slug}`}
                className="flex gap-3 overflow-hidden rounded-card bg-white/85 p-3 shadow-soft ring-1 ring-black/[0.04]"
              >
                <DishVisual
                  slug={item.slug}
                  className="h-20 w-20 shrink-0 rounded-soft"
                  compact
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink">{item.name}</h3>
                    <span className="shrink-0 text-sm font-semibold text-rubies-blue">
                      {formatGhs(item.priceGhs)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {item.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!filtered.length ? (
        <p className="mt-8 text-center text-sm text-muted">No dishes match that search.</p>
      ) : null}
    </div>
  );
}
