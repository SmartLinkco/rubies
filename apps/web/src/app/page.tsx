import { brand } from "@rubies/shared";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ClosedBanner } from "@/components/ClosedBanner";
import { DishVisual } from "@/components/DishVisual";
import { MenuExplorer } from "@/components/MenuExplorer";
import { formatGhs } from "@/lib/format";
import { getMenu, getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [restaurant, menu] = await Promise.all([getRestaurant(), getMenu()]);
  const name = restaurant?.name ?? brand.name;
  const tagline = restaurant?.tagline ?? brand.tagline;
  const recommended = (menu ?? []).slice(0, 4);

  return (
    <AppShell restaurant={restaurant}>
      <div className="px-4 pt-6">
        <header className="animate-rise">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-left text-sm shadow-soft ring-1 ring-black/[0.04]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rubies-red/10 text-rubies-red">
              <PinIcon />
            </span>
            <span>
              <span className="block text-[11px] font-medium uppercase tracking-wide text-muted">
                Deliver to
              </span>
              <span className="font-semibold text-ink">Amamorley · Accra</span>
            </span>
          </button>

          <h1 className="font-display mt-5 text-[2.6rem] leading-[1.05] font-bold tracking-tight text-ink">
            {name}
          </h1>
          <p className="mt-2 max-w-[17rem] text-base text-muted">{tagline}</p>
        </header>

        <div className="mt-5 space-y-3">
          {restaurant ? <ClosedBanner restaurant={restaurant} /> : null}

          {!restaurant ? (
            <div className="rounded-card border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-muted">
              API offline — start <code className="text-ink">npm run dev:api</code>.
            </div>
          ) : null}
        </div>

        <section className="mt-7 animate-rise" style={{ animationDelay: "80ms" }}>
          <div className="overflow-hidden rounded-sheet bg-gradient-to-br from-rubies-red to-rubies-red-deep p-5 text-white shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              Daily delivery
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold leading-snug">
              Good food. Faster to your door.
            </h2>
            <p className="mt-2 max-w-[16rem] text-sm text-white/85">
              Browse the menu, add to cart, or order by phone / WhatsApp.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/menu"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rubies-red"
              >
                View menu
              </Link>
              <Link
                href="/cart"
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30"
              >
                Cart
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Recommended
            </h2>
            <Link href="/menu" className="text-sm font-medium text-rubies-red">
              See all
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recommended.map((item, i) => (
              <Link
                key={item.id}
                href={`/menu/${item.slug}`}
                className="w-40 shrink-0 animate-rise overflow-hidden rounded-card bg-white/90 shadow-soft ring-1 ring-black/[0.04]"
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                <DishVisual slug={item.slug} className="h-28" compact />
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-ink">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-rubies-blue">
                    {formatGhs(item.priceGhs)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display mb-3 text-2xl font-semibold text-ink">
            Explore dishes
          </h2>
          <MenuExplorer items={menu ?? []} mode="grid" />
        </section>

        <p className="mt-10 pb-2 text-center text-xs text-muted">
          {restaurant?.address ?? brand.address}
        </p>
      </div>
    </AppShell>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
    </svg>
  );
}
