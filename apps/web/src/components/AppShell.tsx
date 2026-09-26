import type { ReactNode } from "react";
import type { RestaurantPublicDto } from "@rubies/shared";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";

export function AppShell({
  children,
  restaurant,
}: {
  children: ReactNode;
  restaurant: Pick<RestaurantPublicDto, "phones" | "whatsapp"> | null;
}) {
  const phone = restaurant?.phones[0] ?? "0277491795";
  const whatsapp = restaurant?.whatsapp ?? "233277491795";

  return (
    <>
      <Onboarding />
      <div className="mx-auto min-h-dvh max-w-md pb-28">{children}</div>
      <BottomNav phone={phone} whatsapp={whatsapp} />
    </>
  );
}
