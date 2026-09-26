import { brand } from "@rubies/shared";
import { AppShell } from "@/components/AppShell";
import { CateringHomeSection } from "@/components/CateringHomeSection";
import { ClosedBanner } from "@/components/ClosedBanner";
import { DeliveryHeroCard } from "@/components/DeliveryHero";
import { MenuExplorer } from "@/components/MenuExplorer";
import { PopularDishesRail } from "@/components/PopularDishesRail";
import { getMenu, getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [restaurant, menu] = await Promise.all([getRestaurant(), getMenu()]);
  const address = restaurant?.address ?? brand.address;
  const phone = restaurant?.phones[0] ?? brand.phones[0]!;
  const whatsapp = restaurant?.whatsapp ?? brand.whatsapp;
  const accepting = restaurant?.isAcceptingOrders ?? true;
  const recommended = (menu ?? []).slice(0, 4);

  return (
    <AppShell restaurant={restaurant}>
      <div className="px-4">
        <div className="space-y-3">
          {restaurant ? <ClosedBanner restaurant={restaurant} /> : null}

          {!restaurant ? (
            <div className="rounded-card border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-muted">
              API offline. Start <code className="text-ink">npm run dev:api</code>.
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <DeliveryHeroCard
            phone={phone}
            whatsapp={whatsapp}
            isAcceptingOrders={accepting}
          />
        </div>

        <PopularDishesRail items={recommended} canOrder={accepting} />

        <CateringHomeSection />

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-ink">Explore dishes</h2>
          <MenuExplorer items={menu ?? []} mode="grid" canOrder={accepting} />
        </section>

        <p className="mt-10 pb-2 text-center text-xs text-muted">{address}</p>
      </div>
    </AppShell>
  );
}
