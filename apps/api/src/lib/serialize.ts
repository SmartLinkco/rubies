import type {
  Cart,
  CartItem,
  MenuItem,
  Order,
  OrderItem,
  OrderStatusEvent,
  Review,
  User,
} from "@prisma/client";
import type {
  AddressDto,
  CartDto,
  CartLineDto,
  OrderDto,
  OrderItemDto,
  OrderStatusEventDto,
  ReviewDto,
  UserDto,
} from "@rubies/shared";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
    preferredPayment: user.preferredPayment,
  };
}

export function toAddressDto(address: {
  id: string;
  label: string;
  line1: string;
  landmark: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}): AddressDto {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    landmark: address.landmark,
    city: address.city,
    lat: address.lat,
    lng: address.lng,
    isDefault: address.isDefault,
  };
}

type CartWithItems = Cart & {
  items: (CartItem & { menuItem: MenuItem })[];
};

export function toCartDto(cart: CartWithItems): CartDto {
  const items: CartLineDto[] = cart.items.map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    slug: item.menuItem.slug,
    name: item.menuItem.name,
    priceGhs: Number(item.menuItem.priceGhs),
    quantity: item.quantity,
  }));

  const subtotalGhs = items.reduce(
    (sum, item) => sum + item.priceGhs * item.quantity,
    0,
  );

  return { id: cart.id, items, subtotalGhs };
}

export function toReviewDto(review: Review): ReviewDto {
  return {
    id: review.id,
    orderId: review.orderId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

type OrderWithRelations = Order & {
  items: OrderItem[];
  statusEvents: OrderStatusEvent[];
  review?: Review | null;
};

export function toOrderDto(
  order: OrderWithRelations,
  extras?: { paystackAuthorizationUrl?: string | null },
): OrderDto {
  const items: OrderItemDto[] = order.items.map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.name,
    unitPriceGhs: Number(item.unitPriceGhs),
    quantity: item.quantity,
  }));

  const statusEvents: OrderStatusEventDto[] = order.statusEvents.map((event) => ({
    id: event.id,
    status: event.status,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
  }));

  const review = order.review ? toReviewDto(order.review) : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotalGhs: Number(order.subtotalGhs),
    deliveryFeeGhs: Number(order.deliveryFeeGhs),
    discountGhs: Number(order.discountGhs),
    totalGhs: Number(order.totalGhs),
    deliveryLine1: order.deliveryLine1,
    deliveryLandmark: order.deliveryLandmark,
    deliveryCity: order.deliveryCity,
    guestName: order.guestName,
    guestPhone: order.guestPhone,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items,
    statusEvents,
    paystackAuthorizationUrl: extras?.paystackAuthorizationUrl ?? null,
    review,
    canReview: order.status === "delivered" && !review,
  };
}
