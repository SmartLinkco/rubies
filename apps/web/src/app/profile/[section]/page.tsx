import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

const stubs = [
  {
    slug: "coupons",
    title: "My Coupons",
    body: "Promo codes and offers arrive in Phase 5.",
  },
  {
    slug: "notifications",
    title: "Notifications",
    body: "Order alerts will land here once SMS/email are wired in Phase 7.",
  },
  {
    slug: "help",
    title: "Help & Support",
    body: "Call or WhatsApp Rubies Cuisine from the bottom nav anytime. A full help center can follow later.",
  },
] as const;

export function generateStaticParams() {
  return stubs.map((s) => ({ section: s.slug }));
}

export default async function ProfileStubPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const restaurant = await getRestaurant();
  const stub = stubs.find((s) => s.slug === section) ?? stubs[0]!;

  return (
    <AppShell restaurant={restaurant} title={stub.title} tagline="Profile">
      <div className="px-4">
        <Link href="/profile" className="text-sm font-medium text-muted">
          ← Profile
        </Link>
        <div className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
          <p className="font-semibold text-ink">{stub.title}</p>
          <p className="mt-2 text-sm text-muted">{stub.body}</p>
        </div>
      </div>
    </AppShell>
  );
}
