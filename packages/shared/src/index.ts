export const brand = {
  name: "Rubies Cuisine",
  tagline: "Are you hungry? Don't wait!",
  phones: ["0277491795", "0593933901"],
  whatsapp: "233277491795",
  address: "Rubies Cuisine, MMX5+9C2, Achiaman",
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

export interface UserDto {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: "customer" | "admin";
  preferredPayment: PaymentMethod;
}

export interface AddressDto {
  id: string;
  label: string;
  line1: string;
  landmark: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

export interface CartLineDto {
  id: string;
  menuItemId: string;
  slug: string;
  name: string;
  priceGhs: number;
  quantity: number;
}

export interface CartDto {
  id: string;
  items: CartLineDto[];
  subtotalGhs: number;
}

export interface OrderItemDto {
  id: string;
  menuItemId: string | null;
  name: string;
  unitPriceGhs: number;
  quantity: number;
}

export interface OrderStatusEventDto {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotalGhs: number;
  deliveryFeeGhs: number;
  discountGhs: number;
  totalGhs: number;
  deliveryLine1: string;
  deliveryLandmark: string | null;
  deliveryCity: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  guestName: string | null;
  guestPhone: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItemDto[];
  statusEvents: OrderStatusEventDto[];
  paystackAuthorizationUrl?: string | null;
  review: ReviewDto | null;
  canReview: boolean;
}

export interface DeliveryQuoteDto {
  mode: DeliveryFeeMode;
  deliveryFeeGhs: number;
  distanceKm: number | null;
  withinRange: boolean;
  maxDeliveryKm: number | null;
  message: string | null;
}

export interface PlaceOrderInput {
  paymentMethod: PaymentMethod;
  addressId?: string;
  delivery?: {
    line1: string;
    landmark?: string | null;
    city?: string;
    lat?: number | null;
    lng?: number | null;
  };
  guestName?: string;
  guestPhone?: string;
  notes?: string | null;
  promoCode?: string | null;
}

export interface PlaceOrderResult {
  order: OrderDto;
  authorizationUrl: string | null;
}

export interface ReviewDto {
  id: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface OfferDto {
  id: string;
  code: string;
  title: string;
  description: string;
  percentOff: number | null;
  amountOffGhs: number | null;
  minOrderGhs: number;
  expiresAt: string | null;
  active: boolean;
}

export interface PromoPreviewDto {
  code: string;
  title: string;
  discountGhs: number;
  subtotalGhs: number;
  deliveryFeeGhs: number;
  totalGhs: number;
  message: string | null;
}

export interface CateringInquiryInput {
  name: string;
  phone: string;
  email?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  message: string;
  kind?: "catering" | "event-space";
}

export interface CateringInquiryDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  eventDate: string | null;
  guestCount: number | null;
  message: string;
  status: string;
  createdAt: string;
}

export interface RestaurantAdminDto {
  name: string;
  tagline: string;
  phones: string[];
  whatsapp: string;
  address: string;
  deliveryFeeMode: DeliveryFeeMode;
  fixedDeliveryFeeGhs: number;
  distanceBaseFeeGhs: number;
  distancePerKmGhs: number;
  maxDeliveryKm: number;
  restaurantLat: number;
  restaurantLng: number;
  closedWeekdays: number[];
  forceClosed: boolean;
  forceOpen: boolean;
  isAcceptingOrders: boolean;
  closedReason: string | null;
  nextOpenLabel: string | null;
  notifySmsOnNewOrder: boolean;
  notifyEmailOnNewOrder: boolean;
  ownerEmails: string[];
  ownerPhones: string[];
}

export interface AdminDashboardDto {
  openOrderCount: number;
  pendingConfirmationCount: number;
  deliveredTodayCount: number;
  newCateringCount: number;
  isAcceptingOrders: boolean;
  closedReason: string | null;
  recentOrders: OrderDto[];
}

export interface AdminReviewDto {
  id: string;
  orderId: string;
  orderNumber: string;
  rating: number;
  comment: string | null;
  hidden: boolean;
  guestName: string | null;
  createdAt: string;
}

