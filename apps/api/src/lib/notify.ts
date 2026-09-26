import { Resend } from "resend";
import type { OrderDto } from "@rubies/shared";
import {
  cateringEmailHtml,
  cateringEmailSubject,
  cateringEmailText,
  orderEmailHtml,
  orderEmailSubject,
  orderEmailText,
  type CateringInquiryEmail,
} from "./email-templates.js";

type NotifyChannel = "sms" | "email";

export type NotifyPayload = {
  to: string;
  subject?: string;
  body: string;
  html?: string;
};

let resendClient: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function fromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Rubies Cuisine <onboarding@resend.dev>"
  );
}

function plainBodyToHtml(body: string) {
  const escaped = body
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\n", "<br />");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;">${escaped}</div>`;
}

/** SMS stays stubbed until a Ghana provider is chosen. */
export async function sendSms(payload: NotifyPayload) {
  console.info("[notify:sms:stub]", payload.to, payload.body);
  return { ok: true as const, channel: "sms" as NotifyChannel, stub: true };
}

/** Resend when RESEND_API_KEY is set; otherwise logs a stub. */
export async function sendEmail(payload: NotifyPayload) {
  const resend = getResend();
  const subject = payload.subject?.trim() || "Rubies Cuisine";
  const html = payload.html ?? plainBodyToHtml(payload.body);

  if (!resend) {
    console.info(
      "[notify:email:stub]",
      payload.to,
      subject,
      payload.body.slice(0, 160),
    );
    return { ok: true as const, channel: "email" as NotifyChannel, stub: true };
  }

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [payload.to],
    subject,
    text: payload.body,
    html,
  });

  if (error) {
    console.error("[notify:email:resend]", error);
    return {
      ok: false as const,
      channel: "email" as NotifyChannel,
      stub: false,
      error,
    };
  }

  console.info("[notify:email:resend]", payload.to, data?.id ?? "sent");
  return {
    ok: true as const,
    channel: "email" as NotifyChannel,
    stub: false,
    id: data?.id,
  };
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function notifyOrderStatusChange(input: {
  order: OrderDto;
  customerPhone?: string | null;
  customerEmail?: string | null;
  ownerPhones?: string[];
  ownerEmails?: string[];
  notifyCustomer?: boolean;
  notifyOwner?: boolean;
}) {
  const { order } = input;
  const statusLabel = order.status.replaceAll("_", " ");
  const smsBody = `Rubies Cuisine order ${order.orderNumber} is now: ${statusLabel}.`;
  const jobs: Promise<unknown>[] = [];

  if (input.notifyCustomer !== false) {
    if (input.customerPhone) {
      jobs.push(sendSms({ to: input.customerPhone, body: smsBody }));
    }
    if (input.customerEmail) {
      jobs.push(
        sendEmail({
          to: input.customerEmail,
          subject: orderEmailSubject(order, "customer"),
          body: orderEmailText(order, "customer"),
          html: orderEmailHtml(order, "customer"),
        }),
      );
    }
  }

  if (input.notifyOwner) {
    for (const phone of input.ownerPhones ?? []) {
      jobs.push(
        sendSms({
          to: phone,
          body: `Order ${order.orderNumber}: ${statusLabel} · GHS ${order.totalGhs.toFixed(2)}`,
        }),
      );
    }
    for (const email of input.ownerEmails ?? []) {
      jobs.push(
        sendEmail({
          to: email,
          subject: orderEmailSubject(order, "owner"),
          body: orderEmailText(order, "owner"),
          html: orderEmailHtml(order, "owner"),
        }),
      );
    }
  }

  await Promise.allSettled(jobs);
}

export async function notifyCateringInquiry(
  inquiry: CateringInquiryEmail,
  opts: { ownerPhones?: string[]; ownerEmails?: string[] },
) {
  const jobs: Promise<unknown>[] = [];
  const smsBody = `${inquiry.kind === "event-space" ? "Event space" : "Catering"} inquiry from ${inquiry.name}: ${inquiry.phone}`;

  for (const phone of opts.ownerPhones ?? []) {
    jobs.push(sendSms({ to: phone, body: smsBody }));
  }
  for (const email of opts.ownerEmails ?? []) {
    jobs.push(
      sendEmail({
        to: email,
        subject: cateringEmailSubject(inquiry),
        body: cateringEmailText(inquiry),
        html: cateringEmailHtml(inquiry),
      }),
    );
  }

  await Promise.allSettled(jobs);
}
