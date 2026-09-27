import type {
  AddressDto,
  AdminDashboardDto,
  AdminReviewDto,
  CartDto,
  CateringInquiryDto,
  CateringInquiryInput,
  DeliveryQuoteDto,
  MenuItemDto,
  OfferDto,
  OrderDto,
  OrderStatus,
  PlaceOrderInput,
  PlaceOrderResult,
  PromoPreviewDto,
  RestaurantAdminDto,
  ReviewDto,
  UserDto,
} from "@rubies/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Browser calls go through the Next rewrite so cookies stay same-origin. */
function clientApiBase() {
  if (process.env.NEXT_PUBLIC_API_BROWSER_URL) {
    return process.env.NEXT_PUBLIC_API_BROWSER_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "/api-proxy";
  }
  return API_URL.replace(/\/$/, "");
}

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${clientApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: T; error?: { code: string; message: string } }
    | null;

  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      json?.error?.code ?? "REQUEST_FAILED",
      json?.error?.message ?? "Something went wrong. Please try again.",
    );
  }

  return json?.data as T;
}

export const clientApi = {
  me: () => request<{ user: UserDto }>("/auth/me"),
  registerStart: (body: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }) =>
    request<{ email: string; expiresInSec: number; devCode?: string }>(
      "/auth/register/start",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  registerResend: (body: { email: string }) =>
    request<{ email: string; expiresInSec: number; devCode?: string }>(
      "/auth/register/resend",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  registerVerify: (body: { email: string; code: string }) =>
    request<{ user: UserDto }>("/auth/register/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /** @deprecated Prefer registerStart + registerVerify */
  register: (body: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  }) =>
    request<{ user: UserDto }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: UserDto; cart: CartDto | null }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  passwordForgot: (body: { email: string }) =>
    request<{ ok: boolean; email: string; message: string; devCode?: string }>(
      "/auth/password/forgot",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  passwordReset: (body: { email: string; code: string; password: string }) =>
    request<{ ok: boolean }>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  updateProfile: (body: {
    name?: string;
    phone?: string | null;
    preferredPayment?: "cod" | "paystack";
  }) =>
    request<{ user: UserDto }>("/me/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  listAddresses: () => request<AddressDto[]>("/me/addresses"),
  createAddress: (body: {
    label?: string;
    line1: string;
    landmark?: string | null;
    city?: string;
    lat?: number | null;
    lng?: number | null;
    isDefault?: boolean;
  }) =>
    request<AddressDto>("/me/addresses", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteAddress: (id: string) =>
    request<{ ok: boolean }>(`/me/addresses/${id}`, { method: "DELETE" }),
  getCart: () => request<CartDto>("/cart"),
  putCartItem: (menuItemId: string, quantity: number) =>
    request<CartDto>("/cart/items", {
      method: "PUT",
      body: JSON.stringify({ menuItemId, quantity }),
    }),
  syncCart: (items: { menuItemId: string; quantity: number }[]) =>
    request<CartDto>("/cart/sync", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  replaceCart: (items: { menuItemId: string; quantity: number }[]) =>
    request<CartDto>("/cart/replace", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  quoteDelivery: (body: {
    addressId?: string;
    lat?: number | null;
    lng?: number | null;
  }) =>
    request<{
      quote: DeliveryQuoteDto;
      subtotalGhs: number;
      totalGhs: number;
    }>("/orders/quote", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  placeOrder: (body: PlaceOrderInput) =>
    request<PlaceOrderResult>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getOrder: (orderNumber: string) =>
    request<OrderDto>(`/orders/${encodeURIComponent(orderNumber)}`),
  listMyOrders: () => request<OrderDto[]>("/orders/mine"),
  submitReview: (
    orderNumber: string,
    body: { rating: number; comment?: string | null },
  ) =>
    request<ReviewDto>(`/orders/${encodeURIComponent(orderNumber)}/review`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  completePaystack: (reference: string) =>
    request<OrderDto>("/payments/paystack/complete", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),
  listOffers: () => request<OfferDto[]>("/offers"),
  getOffer: (code: string) =>
    request<OfferDto>(`/offers/${encodeURIComponent(code)}`),
  previewPromo: (body: {
    code: string;
    addressId?: string;
    lat?: number | null;
    lng?: number | null;
  }) =>
    request<PromoPreviewDto & { quote: DeliveryQuoteDto }>("/offers/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  submitCatering: (body: CateringInquiryInput) =>
    request<{ id: string; status: string; message: string }>("/catering", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listCateringInbox: () => request<CateringInquiryDto[]>("/catering/inbox"),

  getAdminDashboard: () => request<AdminDashboardDto>("/admin/dashboard"),
  getAdminStorageStatus: () =>
    request<{ configured: boolean; bucket: string | null; region: string | null }>(
      "/admin/storage",
    ),
  presignMenuUpload: (body: { contentType: string; filename?: string }) =>
    request<{
      key: string;
      uploadUrl: string;
      method: "PUT";
      headers: Record<string, string>;
      publicUrl: string;
      displayUrl: string;
      expiresInSeconds: number;
    }>("/admin/uploads/presign", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listAdminOrders: () => request<OrderDto[]>("/admin/orders"),
  updateOrderStatus: (
    orderNumber: string,
    body: { status: OrderStatus; note?: string | null; markCodPaid?: boolean },
  ) =>
    request<OrderDto>(
      `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  markOrderPaid: (orderNumber: string) =>
    request<OrderDto>(
      `/admin/orders/${encodeURIComponent(orderNumber)}/mark-paid`,
      { method: "PATCH" },
    ),
  listAdminMenu: () => request<MenuItemDto[]>("/admin/menu"),
  createMenuItem: (body: {
    name: string;
    slug?: string;
    description: string;
    priceGhs: number;
    imageUrl?: string | null;
    category?: string;
    available?: boolean;
    sortOrder?: number;
  }) =>
    request<MenuItemDto>("/admin/menu", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMenuItem: (
    id: string,
    body: Partial<{
      name: string;
      slug: string;
      description: string;
      priceGhs: number;
      imageUrl: string | null;
      category: string;
      available: boolean;
      sortOrder: number;
    }>,
  ) =>
    request<MenuItemDto>(`/admin/menu/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMenuItem: (id: string) =>
    request<{ ok?: boolean } | MenuItemDto>(
      `/admin/menu/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  getAdminSettings: () => request<RestaurantAdminDto>("/admin/settings"),
  updateAdminSettings: (body: Partial<RestaurantAdminDto>) =>
    request<RestaurantAdminDto>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  listAdminOffers: () => request<OfferDto[]>("/admin/offers"),
  createOffer: (body: {
    code: string;
    title: string;
    description: string;
    percentOff?: number | null;
    amountOffGhs?: number | null;
    minOrderGhs?: number;
    expiresAt?: string | null;
    active?: boolean;
  }) =>
    request<OfferDto>("/admin/offers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateOffer: (
    id: string,
    body: Partial<{
      code: string;
      title: string;
      description: string;
      percentOff: number | null;
      amountOffGhs: number | null;
      minOrderGhs: number;
      expiresAt: string | null;
      active: boolean;
    }>,
  ) =>
    request<OfferDto>(`/admin/offers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  listAdminReviews: () => request<AdminReviewDto[]>("/admin/reviews"),
  updateReviewVisibility: (id: string, hidden: boolean) =>
    request<AdminReviewDto>(`/admin/reviews/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ hidden }),
    }),
  listAdminCatering: () => request<CateringInquiryDto[]>("/admin/catering"),
  updateCateringStatus: (id: string, status: "new" | "contacted" | "done") =>
    request<CateringInquiryDto>(`/admin/catering/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
