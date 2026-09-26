import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AddressesPanel } from "@/components/AddressesPanel";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const restaurant = await getRestaurant();

  return (
    <AppShell restaurant={restaurant} title="Addresses" tagline="Delivery locations">
      <div className="mb-3 px-4">
        <Link href="/profile" className="text-sm font-medium text-muted">
          ← Profile
        </Link>
      </div>
      <AddressesPanel />
    </AppShell>
  );
}
