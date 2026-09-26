import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

const stubs = [
  {
    slug: "help",
    title: "Help & Support",
    body: "Call or WhatsApp Rubies Cuisine from the bottom nav anytime. A full help center can follow later.",
  },
] as const;

export function generateStaticParams() {
  return [{ section: "notifications" }, ...stubs.map((s) => ({ section: s.slug }))];
}

export default async function ProfileStubPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const restaurant = await getRestaurant();

  if (section === "notifications") {
    return (
      <AppShell restaurant={restaurant} title="Notifications" tagline="Profile">
        <div className="px-4">
          <Link href="/profile" className="text-sm font-medium text-muted">
            ← Profile
          </Link>
          <NotificationsPanel />
        </div>
      </AppShell>
    );
  }

  if (section === "coupons") {
    return (
      <AppShell restaurant={restaurant} title="My Coupons" tagline="Profile">
        <div className="px-4">
          <Link href="/profile" className="text-sm font-medium text-muted">
            ← Profile
          </Link>
          <div className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
            <p className="font-semibold text-ink">Active offers</p>
            <p className="mt-2 text-sm text-muted">
              Browse current promo codes and apply them at checkout.
            </p>
            <Link
              href="/offers"
              className="mt-4 inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
            >
              View offers
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

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
