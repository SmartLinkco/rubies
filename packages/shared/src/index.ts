export const brand = {
  name: "Rubies Cuisine",
  tagline: "Are you hungry? Don't wait!",
  phones: ["0277491795", "0593933901"],
  whatsapp: "233277491795",
  address: "Amamorley Canada Junction, off the Pokuase–Ablekuma Highway",
  currency: "GHS",
  colors: {
    cream: "#FBF6F0",
    creamDeep: "#F3EBE1",
    red: "#E10600",
    redDeep: "#B80500",
    blue: "#1B3A9C",
    blueSoft: "#2F4FB8",
    ink: "#1A1A1A",
    muted: "#6B6560",
    white: "#FFFFFF",
    success: "#1F7A4D",
    warning: "#C47A00",
  },
  radii: {
    sm: "12px",
    md: "20px",
    lg: "28px",
    full: "9999px",
  },
} as const;

export type DeliveryFeeMode = "fixed" | "distance";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "paystack";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface MenuItemDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceGhs: number;
  imageUrl: string | null;
  category: string;
  available: boolean;
  sortOrder: number;
}

export interface RestaurantPublicDto {
  name: string;
  tagline: string;
  phones: string[];
  whatsapp: string;
  address: string;
  isAcceptingOrders: boolean;
  closedReason: string | null;
  nextOpenLabel: string | null;
  deliveryFeeMode: DeliveryFeeMode;
  fixedDeliveryFeeGhs: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccess<T> {
  data: T;
}
