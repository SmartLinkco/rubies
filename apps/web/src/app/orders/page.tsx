import { brand } from "@rubies/shared";
import { AppShell } from "@/components/AppShell";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const restaurant = await getRestaurant();

  return (
    <AppShell restaurant={restaurant}>
      <div className="px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-ink">Orders</h1>
        <p className="mt-2 text-sm text-muted">
          Live status and history arrive in Phase 4.
        </p>
        <div className="mt-8 rounded-card bg-white/80 px-4 py-10 text-center shadow-soft">
          <p className="text-sm text-muted">No orders yet.</p>
          <p className="mt-2 text-xs text-muted">
            For now, call {brand.phones[0]} or WhatsApp your cart.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
