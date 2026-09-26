import { AppShell } from "@/components/AppShell";
import { MenuExplorer } from "@/components/MenuExplorer";
import { getMenu, getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [restaurant, menu] = await Promise.all([getRestaurant(), getMenu()]);

  return (
    <AppShell restaurant={restaurant}>
      <div className="px-4 pt-6">
        <h1 className="font-display animate-rise text-3xl font-bold text-ink">Menu</h1>
        <p className="mt-2 text-sm text-muted">
          Four favourites to start — every dish GHS 45.
        </p>
        <div className="mt-6">
          <MenuExplorer items={menu ?? []} mode="list" />
        </div>
      </div>
    </AppShell>
  );
}
