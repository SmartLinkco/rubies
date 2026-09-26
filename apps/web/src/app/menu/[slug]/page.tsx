import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MenuItemDetail } from "@/components/MenuItemDetail";
import { getMenuItem, getOffers, getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [restaurant, item, offers] = await Promise.all([
    getRestaurant(),
    getMenuItem(slug),
    getOffers(),
  ]);

  if (!item) notFound();

  const offer = offers?.[0] ?? null;

  return (
    <AppShell restaurant={restaurant} showTopBar={false}>
      <MenuItemDetail item={item} restaurant={restaurant} offer={offer} />
    </AppShell>
  );
}
