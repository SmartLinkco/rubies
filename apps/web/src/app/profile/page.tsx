import { brand } from "@rubies/shared";
import { AppShell } from "@/components/AppShell";
import { ProfilePanel } from "@/components/ProfilePanel";
import { formatPhoneDisplay } from "@/lib/format";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const restaurant = await getRestaurant();
  const phones = (restaurant?.phones ?? [...brand.phones]).map(formatPhoneDisplay);

  return (
    <AppShell restaurant={restaurant} title="Profile" tagline="Your account">
      <ProfilePanel
        restaurantName={restaurant?.name ?? brand.name}
        restaurantPhones={phones}
      />
    </AppShell>
  );
}
