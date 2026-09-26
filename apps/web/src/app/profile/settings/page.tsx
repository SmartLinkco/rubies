import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SettingsPanel } from "@/components/SettingsPanel";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const restaurant = await getRestaurant();

  return (
    <AppShell restaurant={restaurant} title="Settings" tagline="Account preferences">
      <div className="mb-3 px-4">
        <Link href="/profile" className="text-sm font-medium text-muted">
          ← Profile
        </Link>
      </div>
      <SettingsPanel />
    </AppShell>
  );
}
