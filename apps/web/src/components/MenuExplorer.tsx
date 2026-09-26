"use client";

import type { MenuItemDto } from "@rubies/shared";
import { useMemo, useState } from "react";
import { MenuItemCard } from "@/components/MenuItemCard";
import { categoryForSlug } from "@/lib/dish";

const CATEGORY_THUMB: Record<string, string> = {
  Rice: "/categories/cat-rice.webp",
  Swallow: "/categories/cat-swallow.webp",
  Grill: "/categories/cat-grill.webp",
};

export function MenuExplorer({
  items,
  mode = "grid",
  canOrder = true,
}: {
  items: MenuItemDto[];
  mode?: "grid" | "list";
  canOrder?: boolean;
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
          const thumb = CATEGORY_THUMB[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition ${
                active
                  ? "bg-rubies-red text-white shadow-soft"
                  : "bg-white/80 text-muted ring-1 ring-black/[0.05]"
              }`}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-black/5"
                  decoding="async"
                />
              ) : (
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-cream-deep text-ink"
                  }`}
                >
                  All
                </span>
              )}
              {cat}
            </button>
          );
        })}
      </div>

      {mode === "grid" ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {filtered.map((item, i) => (
            <MenuItemCard
              key={item.id}
              item={item}
              canOrder={canOrder}
              layout="grid"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((item, i) => (
            <li key={item.id} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <MenuItemCard item={item} canOrder={canOrder} layout="list" />
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
