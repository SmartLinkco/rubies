import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { AppShell } from "@/components/AppShell";
import { DishVisual } from "@/components/DishVisual";
import { formatGhs } from "@/lib/format";
import { getMenuItem, getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [restaurant, item] = await Promise.all([
    getRestaurant(),
    getMenuItem(slug),
  ]);

  if (!item) notFound();

  const accepting = restaurant?.isAcceptingOrders ?? true;

  return (
    <AppShell restaurant={restaurant}>
      <div>
        <div className="relative">
          <DishVisual slug={item.slug} className="h-[42vh] min-h-[240px] w-full" />
          <Link
            href="/menu"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-ink shadow-soft"
            aria-label="Back to menu"
          >
            ←
          </Link>
        </div>

        <div className="px-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rubies-blue">
            Rubies Cuisine
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-ink">{item.name}</h1>
          <p className="mt-1 text-lg font-semibold text-rubies-red">
            {formatGhs(item.priceGhs)}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted">{item.description}</p>

          <div className="mt-8 rounded-card bg-white/85 p-4 shadow-soft ring-1 ring-black/[0.04]">
            <p className="text-sm font-semibold text-ink">Prefer to order by phone?</p>
            <p className="mt-1 text-sm text-muted">
              Use Call (red) or WhatsApp (green) in the nav bar for this dish.
            </p>
          </div>

          <div className="mt-6">
            <AddToCartButton
              item={item}
              disabled={!accepting}
              disabledReason={restaurant?.closedReason}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
