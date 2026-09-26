import type { ReactNode } from "react";
import { brand } from "@rubies/shared";
import type { RestaurantPublicDto } from "@rubies/shared";
import { BottomNav } from "@/components/BottomNav";
import { HomeTopBar } from "@/components/DeliveryHero";
import { LocationPicker } from "@/components/LocationPicker";
import { LocationProvider } from "@/components/LocationProvider";
import { Onboarding } from "@/components/Onboarding";

export function AppShell({
  children,
  restaurant,
  title,
  tagline,
  showTopBar = true,
}: {
  children: ReactNode;
  restaurant: Pick<
    RestaurantPublicDto,
    "phones" | "whatsapp" | "name" | "tagline" | "address"
  > | null;
  title?: string;
  tagline?: string;
  showTopBar?: boolean;
}) {
  const phone = restaurant?.phones[0] ?? brand.phones[0]!;
  const whatsapp = restaurant?.whatsapp ?? brand.whatsapp;
  const topTitle = title ?? restaurant?.name ?? brand.name;
  const topTagline = tagline ?? restaurant?.tagline ?? brand.tagline;
  const fallbackAddress = restaurant?.address ?? brand.address;

  return (
    <LocationProvider fallbackAddress={fallbackAddress}>
      <Onboarding />
      <div className="mx-auto min-h-dvh max-w-md pb-28">
        {showTopBar ? (
          <div className="sticky top-0 z-30 bg-cream/90 px-4 pb-3 pt-5 backdrop-blur-md">
            <HomeTopBar title={topTitle} tagline={topTagline} />
          </div>
        ) : null}
        {children}
      </div>
      <BottomNav phone={phone} whatsapp={whatsapp} />
      <LocationPicker />
    </LocationProvider>
  );
}
