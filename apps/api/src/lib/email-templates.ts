import { brand } from "@rubies/shared";
import type { OrderDto, OrderStatus, PaymentMethod, PaymentStatus } from "@rubies/shared";

const C = brand.colors;

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatGhs(amount: number) {
  return `GHS ${amount.toFixed(2)}`;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function paymentLabel(method: PaymentMethod, paymentStatus: PaymentStatus) {
  if (method === "cod") {
    return paymentStatus === "paid" ? "Cash on delivery · Paid" : "Cash on delivery";
  }
  if (paymentStatus === "paid") return "Paid online";
  if (paymentStatus === "failed") return "Payment failed";
  return "Pay now · Awaiting payment";
}

function statusTone(status: string): { bg: string; text: string } {
  switch (status) {
    case "delivered":
      return { bg: "#E8F5EE", text: C.success };
    case "cancelled":
      return { bg: "#F3EBE1", text: C.muted };
    case "on_the_way":
      return { bg: "#E8EEF9", text: C.blue };
    case "preparing":
      return { bg: "#FFF0E8", text: "#C45A00" };
    default:
      return { bg: "#FDECEC", text: C.red };
  }
}

function webBase() {
  return (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",")[0]!.trim();
}

function emailShell(opts: {
  preheader: string;
  title: string;
  eyebrow?: string;
  bodyHtml: string;
}) {
  const preheader = escapeHtml(opts.preheader);
  const title = escapeHtml(opts.title);
  const eyebrow = opts.eyebrow ? escapeHtml(opts.eyebrow) : null;
  const phones = brand.phones.map((p) => escapeHtml(p)).join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.creamDeep};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.creamDeep};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.white};border-radius:28px;overflow:hidden;box-shadow:0 12px 40px rgba(26,26,26,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg, ${C.red} 0%, ${C.redDeep} 55%, ${C.blue} 160%);padding:28px 28px 24px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:${C.white};">
                ${escapeHtml(brand.name)}
              </p>
              <p style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                ${escapeHtml(brand.tagline)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:system-ui,-apple-system,sans-serif;color:${C.ink};">
              ${eyebrow ? `<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.red};">${eyebrow}</p>` : ""}
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:700;color:${C.ink};">
                ${title}
              </h1>
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-family:system-ui,-apple-system,sans-serif;">
              <div style="border-top:1px solid ${C.creamDeep};padding-top:20px;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${C.ink};">${escapeHtml(brand.name)}</p>
                <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:${C.muted};">${escapeHtml(brand.address)}</p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:${C.muted};">
                  Call ${phones} · Closed Wednesdays
                </p>
              </div>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:system-ui,sans-serif;font-size:11px;color:${C.muted};">
          Home-cooked Ghanaian meals · Achiaman
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:${C.muted};vertical-align:top;width:38%;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;font-weight:600;color:${C.ink};vertical-align:top;">${value}</td>
  </tr>`;
}

function itemsTable(order: OrderDto) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.creamDeep};font-size:14px;color:${C.ink};">
          <strong>${escapeHtml(item.name)}</strong>
          <span style="color:${C.muted};"> × ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.creamDeep};font-size:14px;font-weight:600;color:${C.ink};text-align:right;white-space:nowrap;">
          ${formatGhs(item.unitPriceGhs * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${rows}</table>`;
}

function totalsBlock(order: OrderDto) {
  const lines = [
    ["Subtotal", formatGhs(order.subtotalGhs)],
    ["Delivery", formatGhs(order.deliveryFeeGhs)],
  ];
  if (order.discountGhs > 0) {
    lines.push(["Discount", `−${formatGhs(order.discountGhs)}`]);
  }

  const mid = lines
    .map(
      ([label, value]) => `<tr>
      <td style="padding:4px 0;font-size:13px;color:${C.muted};">${escapeHtml(label!)}</td>
      <td style="padding:4px 0;font-size:13px;color:${C.ink};text-align:right;">${value}</td>
    </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    ${mid}
    <tr>
      <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:${C.ink};border-top:1px solid ${C.creamDeep};">Total</td>
      <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:${C.red};text-align:right;border-top:1px solid ${C.creamDeep};">${formatGhs(order.totalGhs)}</td>
    </tr>
  </table>`;
}

function deliveryBlock(order: OrderDto) {
  const parts = [
    escapeHtml(order.deliveryLine1),
    order.deliveryLandmark ? escapeHtml(order.deliveryLandmark) : null,
    escapeHtml(order.deliveryCity),
  ]
    .filter(Boolean)
    .join("<br />");
  return parts;
}

function ctaButton(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:20px;padding:12px 22px;border-radius:999px;background:${C.red};color:${C.white};font-size:14px;font-weight:700;text-decoration:none;">
    ${escapeHtml(label)}
  </a>`;
}

function itemsHeadline(order: OrderDto) {
  const names = order.items.map((i) => i.name).filter(Boolean);
  if (names.length === 0) return "Your order";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} +${names.length - 1} more`;
}

export function orderEmailText(order: OrderDto, audience: "customer" | "owner") {
  const status = statusLabel(order.status);
  const dishes = itemsHeadline(order);
  const who =
    audience === "owner"
      ? `New/updated order for ${brand.name}`
      : `Your ${brand.name} order update`;
  const lines = [
    who,
    "",
    `Dishes: ${dishes}`,
    `Order: ${order.orderNumber}`,
    `Status: ${status}`,
    `Payment: ${paymentLabel(order.paymentMethod, order.paymentStatus)}`,
    "",
    "Items:",
    ...order.items.map(
      (i) => `• ${i.name} × ${i.quantity} — ${formatGhs(i.unitPriceGhs * i.quantity)}`,
    ),
    "",
    `Subtotal: ${formatGhs(order.subtotalGhs)}`,
    `Delivery: ${formatGhs(order.deliveryFeeGhs)}`,
    order.discountGhs > 0 ? `Discount: −${formatGhs(order.discountGhs)}` : null,
    `Total: ${formatGhs(order.totalGhs)}`,
    "",
    `Deliver to: ${order.deliveryLine1}`,
    order.deliveryLandmark ? `Landmark: ${order.deliveryLandmark}` : null,
    `City: ${order.deliveryCity}`,
    order.guestName ? `Customer: ${order.guestName}` : null,
    order.guestPhone ? `Phone: ${order.guestPhone}` : null,
    order.notes ? `Notes: ${order.notes}` : null,
    "",
    brand.address,
    `Call ${brand.phones.join(" / ")}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export function orderEmailHtml(order: OrderDto, audience: "customer" | "owner") {
  const tone = statusTone(order.status);
  const status = statusLabel(order.status);
  const dishes = itemsHeadline(order);
  const orderUrl = `${webBase()}/orders/${encodeURIComponent(order.orderNumber)}`;
  const isNew = order.status === "pending_confirmation";

  const title =
    audience === "owner"
      ? isNew
        ? dishes
        : `${dishes} · ${status}`
      : isNew
        ? dishes
        : `${dishes} · ${status}`;

  const intro =
    audience === "owner"
      ? isNew
        ? "A customer just placed an order. Open the admin board to confirm and start prep."
        : `<strong>${escapeHtml(dishes)}</strong> is now <strong>${escapeHtml(status)}</strong>.`
      : isNew
        ? `Thanks for ordering from ${escapeHtml(brand.name)}. We’ll confirm shortly and keep you updated.`
        : `Your <strong>${escapeHtml(dishes)}</strong> order is now <strong>${escapeHtml(status)}</strong>.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${C.muted};">${intro}</p>
    <div style="display:inline-block;margin:0 0 18px;padding:6px 12px;border-radius:999px;background:${tone.bg};color:${tone.text};font-size:12px;font-weight:700;text-transform:capitalize;">
      ${escapeHtml(status)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${detailRow("Order", escapeHtml(order.orderNumber))}
      ${detailRow("Payment", escapeHtml(paymentLabel(order.paymentMethod, order.paymentStatus)))}
      ${order.guestName ? detailRow("Customer", escapeHtml(order.guestName)) : ""}
      ${order.guestPhone ? detailRow("Phone", escapeHtml(order.guestPhone)) : ""}
      ${detailRow("Deliver to", deliveryBlock(order))}
      ${order.notes ? detailRow("Notes", escapeHtml(order.notes)) : ""}
    </table>
    <p style="margin:20px 0 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.blue};">Items</p>
    ${itemsTable(order)}
    ${totalsBlock(order)}
    ${ctaButton(
      audience === "owner" ? `${webBase()}/admin/orders` : orderUrl,
      audience === "owner" ? "Open orders board" : "Track your order",
    )}
  `;

  return emailShell({
    preheader: `${dishes} · ${status} · ${formatGhs(order.totalGhs)}`,
    title,
    eyebrow: audience === "owner" ? "Kitchen alert" : "Order update",
    bodyHtml,
  });
}

export function orderEmailSubject(order: OrderDto, audience: "customer" | "owner") {
  const status = statusLabel(order.status);
  const dishes = itemsHeadline(order);
  if (audience === "owner") {
    return order.status === "pending_confirmation"
      ? `New order · ${dishes} · ${formatGhs(order.totalGhs)}`
      : `${dishes} · ${status}`;
  }
  return order.status === "pending_confirmation"
    ? `Order received · ${dishes}`
    : `${dishes} is ${status}`;
}

export type CateringInquiryEmail = {
  name: string;
  phone: string;
  email?: string | null;
  eventDate?: Date | null;
  guestCount?: number | null;
  message: string;
  kind?: "catering" | "event-space";
};

export function cateringEmailText(inquiry: CateringInquiryEmail) {
  const kind = inquiry.kind === "event-space" ? "Event space" : "Catering";
  return [
    `New ${kind.toLowerCase()} inquiry`,
    "",
    `Name: ${inquiry.name}`,
    `Phone: ${inquiry.phone}`,
    inquiry.email ? `Email: ${inquiry.email}` : null,
    inquiry.guestCount ? `Guests: ${inquiry.guestCount}` : null,
    inquiry.eventDate
      ? `Event date: ${inquiry.eventDate.toISOString().slice(0, 10)}`
      : null,
    "",
    inquiry.message,
    "",
    brand.name,
    brand.address,
  ]
    .filter(Boolean)
    .join("\n");
}

export function cateringEmailHtml(inquiry: CateringInquiryEmail) {
  const kind = inquiry.kind === "event-space" ? "Event space" : "Catering";
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${C.muted};">
      Someone requested a quote for <strong>${escapeHtml(kind.toLowerCase())}</strong>. Reply by phone or WhatsApp when you can.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow("Name", escapeHtml(inquiry.name))}
      ${detailRow("Phone", escapeHtml(inquiry.phone))}
      ${inquiry.email ? detailRow("Email", escapeHtml(inquiry.email)) : ""}
      ${inquiry.guestCount != null ? detailRow("Guests", String(inquiry.guestCount)) : ""}
      ${
        inquiry.eventDate
          ? detailRow("Event date", escapeHtml(inquiry.eventDate.toISOString().slice(0, 10)))
          : ""
      }
    </table>
    <div style="margin-top:18px;padding:16px;border-radius:16px;background:${C.cream};">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.blue};">Message</p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:${C.ink};white-space:pre-wrap;">${escapeHtml(inquiry.message)}</p>
    </div>
    ${ctaButton(`${webBase()}/admin/catering`, "Open inquiries")}
  `;

  return emailShell({
    preheader: `${kind} inquiry from ${inquiry.name}`,
    title: `${kind} inquiry`,
    eyebrow: "Events desk",
    bodyHtml,
  });
}

export function cateringEmailSubject(inquiry: CateringInquiryEmail) {
  const kind = inquiry.kind === "event-space" ? "Event space" : "Catering";
  return `${kind} inquiry — ${inquiry.name}`;
}

export type { OrderStatus };
