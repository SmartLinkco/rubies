import type { RestaurantPublicDto } from "@rubies/shared";

export function ClosedBanner({ restaurant }: { restaurant: RestaurantPublicDto }) {
  if (restaurant.isAcceptingOrders) {
    const now = new Date();
    const isTuesdayEvening = now.getDay() === 2 && now.getHours() >= 17;
    if (!isTuesdayEvening) return null;

    return (
      <div className="animate-rise rounded-card bg-rubies-blue/10 px-4 py-3 text-sm text-rubies-blue ring-1 ring-rubies-blue/15">
        <p className="font-semibold">Last orders today</p>
        <p className="mt-1 text-rubies-blue/80">
          We&apos;re closed Wednesdays — order now before tomorrow&apos;s pause.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-rise rounded-card bg-rubies-blue px-4 py-3 text-sm text-white shadow-soft">
      <p className="font-semibold">{restaurant.closedReason}</p>
      {restaurant.nextOpenLabel ? (
        <p className="mt-1 text-white/85">
          Earliest delivery: {restaurant.nextOpenLabel}
        </p>
      ) : null}
    </div>
  );
}
