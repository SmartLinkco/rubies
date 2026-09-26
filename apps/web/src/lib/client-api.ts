import type {
  AddressDto,
  CartDto,
  CateringInquiryInput,
  DeliveryQuoteDto,
  OfferDto,
  OrderDto,
  OrderStatus,
  PlaceOrderInput,
  PlaceOrderResult,
  PromoPreviewDto,
  ReviewDto,
  UserDto,
} from "@rubies/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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
      json?.error?.message ?? "Request failed",
    );
  }

  return json?.data as T;
}

export const clientApi = {
  me: () => request<{ user: UserDto }>("/auth/me"),
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
  logout: () =>
    request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
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
  listAdminOrders: () => request<OrderDto[]>("/admin/orders"),
  updateOrderStatus: (
    orderNumber: string,
    body: { status: OrderStatus; note?: string | null; markCodPaid?: boolean },
  ) =>
    request<OrderDto>(
      `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
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
  listCateringInbox: () =>
    request<
      {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        eventDate: string | null;
        guestCount: number | null;
        message: string;
        status: string;
        createdAt: string;
      }[]
    >("/catering/inbox"),
};
