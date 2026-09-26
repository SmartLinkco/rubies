import { AppShell } from "@/components/AppShell";
import { MenuExplorer } from "@/components/MenuExplorer";
import { getMenu, getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [restaurant, menu] = await Promise.all([getRestaurant(), getMenu()]);
  const accepting = restaurant?.isAcceptingOrders ?? true;

  return (
    <AppShell restaurant={restaurant} title="Menu" tagline="Every dish GHS 45">
      <div className="px-4">
        <div className="mt-2">
          <MenuExplorer items={menu ?? []} mode="list" canOrder={accepting} />
        </div>
      </div>
    </AppShell>
  );
}
