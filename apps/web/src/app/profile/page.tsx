import { brand } from "@rubies/shared";
import { AppShell } from "@/components/AppShell";
import { formatPhoneDisplay } from "@/lib/format";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const restaurant = await getRestaurant();
  const phones = restaurant?.phones ?? [...brand.phones];
  const address = restaurant?.address ?? brand.address;

  return (
    <AppShell restaurant={restaurant}>
      <div className="px-4 pt-6">
        <h1 className="font-display text-3xl font-bold text-ink">Profile</h1>
        <p className="mt-2 text-sm text-muted">
          Guest checkout and saved addresses land in Phase 2.
        </p>

        <div className="mt-8 overflow-hidden rounded-card bg-white/85 shadow-soft ring-1 ring-black/[0.04]">
          <div className="bg-gradient-to-r from-rubies-red to-rubies-blue px-4 py-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              Restaurant
            </p>
            <p className="font-display mt-1 text-2xl font-bold">
              {restaurant?.name ?? brand.name}
            </p>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Address
              </p>
              <p className="mt-1 text-ink">{address}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Phones
              </p>
              <p className="mt-1 text-ink">
                {phones.map(formatPhoneDisplay).join(" · ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Hours note
              </p>
              <p className="mt-1 text-ink">Closed Wednesdays</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
