import { brand } from "@rubies/shared";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { getRestaurant } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const restaurant = await getRestaurant();
  const name = restaurant?.name ?? brand.name;
  const tagline = restaurant?.tagline ?? brand.tagline;
  const phones = restaurant?.phones?.length ? restaurant.phones : [...brand.phones];
  const whatsapp = restaurant?.whatsapp ?? brand.whatsapp;
  const address = restaurant?.address ?? brand.address;
  const closedReason = restaurant?.closedReason;
  const nextOpen = restaurant?.nextOpenLabel;

  return (
    <AppShell restaurant={restaurant} title="About" tagline={name}>
      <div className="space-y-4 px-4 pb-4">
        <section className="relative mt-2 overflow-hidden rounded-card text-white shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about/about-kitchen.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-rubies-red via-rubies-red/85 to-rubies-red/55"
            aria-hidden
          />
          <div className="relative p-5">
            <p className="font-display text-2xl font-bold">{name}</p>
            <p className="mt-1 text-sm text-white/85">{tagline}</p>
            <p className="mt-4 text-sm text-white/90">
              Daily delivery from Amamorley. We also take event orders, corporate
              catering, and bulk cooking for families. Closed Wednesdays.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-card bg-white/90 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about/about-food.png"
            alt="Plated Ghanaian dishes from Rubies Cuisine"
            className="h-40 w-full object-cover"
          />
          <div className="p-4">
            <h2 className="text-sm font-semibold text-ink">Home-cooked plates</h2>
            <p className="mt-2 text-sm text-muted">
              Jollof, fufu, banku, and grilled chicken prepared fresh for delivery
              across Amamorley.
            </p>
          </div>
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Hours</h2>
          <p className="mt-2 text-sm text-ink">
            Open daily except Wednesdays.
          </p>
          {closedReason ? (
            <p className="mt-2 text-sm text-rubies-red">
              {closedReason}
              {nextOpen ? ` Earliest: ${nextOpen}.` : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-emerald-800">Accepting orders now.</p>
          )}
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Location</h2>
          <p className="mt-2 text-sm text-ink">{address}</p>
          <p className="mt-1 text-xs text-muted">Greater Accra, Ghana</p>
        </section>

        <section className="rounded-card bg-white/90 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">Contact</h2>
          <ul className="mt-3 space-y-2">
            {phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone}`}
                  className="text-sm font-medium text-rubies-blue"
                >
                  {formatPhoneDisplay(phone)}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={`tel:${phones[0]}`}
              className="rounded-full bg-rubies-red px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              Call
            </a>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/offers"
            className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-ink ring-1 ring-black/10"
          >
            Offers
          </Link>
          <Link
            href="/catering"
            className="rounded-full bg-rubies-blue px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Catering
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
