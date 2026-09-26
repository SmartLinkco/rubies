import type { RestaurantSettings } from "@prisma/client";

export type AcceptingOrdersResult = {
  isAcceptingOrders: boolean;
  closedReason: string | null;
  nextOpenLabel: string | null;
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Accra is UTC+0 year-round */
export function getAccraNow(date = new Date()): Date {
  return date;
}

export function evaluateAcceptingOrders(
  settings: Pick<
    RestaurantSettings,
    "closedWeekdays" | "forceClosed" | "forceOpen"
  >,
  now = getAccraNow(),
): AcceptingOrdersResult {
  if (settings.forceOpen) {
    return {
      isAcceptingOrders: true,
      closedReason: null,
      nextOpenLabel: null,
    };
  }

  if (settings.forceClosed) {
    return {
      isAcceptingOrders: false,
      closedReason: "Temporarily closed. Check back soon.",
      nextOpenLabel: nextOpenDayLabel(settings.closedWeekdays, now),
    };
  }

  const weekday = now.getDay();
  if (settings.closedWeekdays.includes(weekday)) {
    const dayName = WEEKDAY_NAMES[weekday] ?? "today";
    return {
      isAcceptingOrders: false,
      closedReason: `Closed ${dayName}s. Order again ${nextOpenDayLabel(settings.closedWeekdays, now)}.`,
      nextOpenLabel: nextOpenDayLabel(settings.closedWeekdays, now),
    };
  }

  return {
    isAcceptingOrders: true,
    closedReason: null,
    nextOpenLabel: null,
  };
}

function nextOpenDayLabel(closedWeekdays: number[], from: Date): string {
  for (let i = 1; i <= 7; i += 1) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    if (!closedWeekdays.includes(d.getDay())) {
      return WEEKDAY_NAMES[d.getDay()] ?? "soon";
    }
  }
  return "soon";
}
