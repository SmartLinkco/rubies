import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getRestaurant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const restaurant = await getRestaurant();

  return (
    <AppShell restaurant={restaurant} title="Payment" tagline="Methods & preference">
      <div className="px-4">
        <Link href="/profile" className="text-sm font-medium text-muted">
          ← Profile
        </Link>
        <div className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
          <p className="font-semibold text-ink">Cash or pay now</p>
          <p className="mt-2 text-sm text-muted">
            Pay cash on delivery, or pay securely online at checkout. Set your
            default preference in Settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/profile/settings"
              className="inline-flex rounded-full bg-rubies-red px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open settings
            </Link>
            <Link
              href="/checkout"
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-black/10"
            >
              Go to checkout
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
