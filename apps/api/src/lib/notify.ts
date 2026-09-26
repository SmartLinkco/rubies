type NotifyChannel = "sms" | "email";

export type NotifyPayload = {
  to: string;
  subject?: string;
  body: string;
};

/** Pluggable stubs — real providers land in Phase 7. */
export async function sendSms(payload: NotifyPayload) {
  console.info("[notify:sms:stub]", payload.to, payload.body);
  return { ok: true as const, channel: "sms" as NotifyChannel, stub: true };
}

export async function sendEmail(payload: NotifyPayload) {
  console.info("[notify:email:stub]", payload.to, payload.subject ?? "", payload.body);
  return { ok: true as const, channel: "email" as NotifyChannel, stub: true };
}

export async function notifyOrderStatusChange(input: {
  orderNumber: string;
  status: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  ownerPhones?: string[];
  ownerEmails?: string[];
  notifyCustomer?: boolean;
  notifyOwner?: boolean;
}) {
  const body = `Rubies Cuisine order ${input.orderNumber} is now: ${input.status.replaceAll("_", " ")}.`;
  const jobs: Promise<unknown>[] = [];

  if (input.notifyCustomer !== false) {
    if (input.customerPhone) {
      jobs.push(sendSms({ to: input.customerPhone, body }));
    }
    if (input.customerEmail) {
      jobs.push(
        sendEmail({
          to: input.customerEmail,
          subject: `Order ${input.orderNumber} update`,
          body,
        }),
      );
    }
  }

  if (input.notifyOwner) {
    for (const phone of input.ownerPhones ?? []) {
      jobs.push(sendSms({ to: phone, body: `New/updated order ${input.orderNumber}: ${input.status}` }));
    }
    for (const email of input.ownerEmails ?? []) {
      jobs.push(
        sendEmail({
          to: email,
          subject: `Order ${input.orderNumber}`,
          body: `Order ${input.orderNumber} status: ${input.status}`,
        }),
      );
    }
  }

  await Promise.allSettled(jobs);
}
