import { parseGatewayPayload, type NormalizedPayment } from "@/lib/billing";

export const MOYASAR_FORM_CSS =
  "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.10/dist/moyasar.css";
export const MOYASAR_FORM_JS =
  "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.10/dist/moyasar.umd.js";

export const MOYASAR_APPLE_PAY_VALIDATE_URL =
  "https://api.moyasar.com/v1/applepay/initiate";

export type MoyasarPaymentResource = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description?: string;
  invoice_id?: string | null;
  metadata?: Record<string, unknown> | null;
  source?: {
    type?: string;
    company?: string;
  };
};

export type MoyasarInvoiceResource = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown> | null;
  payments?: MoyasarPaymentResource[];
};

function moyasarSecret() {
  return process.env.MOYASAR_SECRET_KEY ?? "";
}

function authHeader(secret: string) {
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export async function fetchMoyasarPayment(
  paymentId: string,
): Promise<MoyasarPaymentResource | null> {
  const secret = moyasarSecret();
  if (!secret || !paymentId) {
    return null;
  }

  const response = await fetch(
    `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: authHeader(secret) },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as MoyasarPaymentResource;
}

export async function fetchMoyasarInvoice(
  invoiceId: string,
): Promise<MoyasarInvoiceResource | null> {
  const secret = moyasarSecret();
  if (!secret || !invoiceId) {
    return null;
  }

  const response = await fetch(
    `https://api.moyasar.com/v1/invoices/${encodeURIComponent(invoiceId)}`,
    {
      headers: { Authorization: authHeader(secret) },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as MoyasarInvoiceResource;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function metadataLike(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}

export async function hydratePaymentFromMoyasar(
  payment: NormalizedPayment,
  rawEvent: unknown,
): Promise<NormalizedPayment> {
  if (payment.paid && payment.userId && payment.plan) {
    return payment;
  }

  const root = asRecord(rawEvent);
  const eventType = String(root?.type ?? root?.event_type ?? "");
  const nested = asRecord(root?.data) ?? root;
  const isInvoice =
    eventType === "invoice.paid" ||
    eventType === "invoice_paid" ||
    Boolean(nested && Array.isArray(nested.payments));

  if (isInvoice) {
    const fetched = await fetchMoyasarInvoice(
      String(nested?.id ?? payment.paymentId),
    );
    const invoice = (fetched ?? nested) as MoyasarInvoiceResource | Record<string, unknown>;
    const invoiceRecord = asRecord(invoice) ?? {};
    const payments = Array.isArray(invoiceRecord.payments)
      ? (invoiceRecord.payments as MoyasarPaymentResource[])
      : [];
    const paidPayment =
      payments.find((item) => item.status === "paid" || item.status === "captured") ??
      payments[0];
    const parsed = parseGatewayPayload({
      id: root?.id ?? paidPayment?.id ?? payment.eventId,
      type: eventType || "invoice.paid",
      data: {
        ...invoiceRecord,
        ...(paidPayment ?? {}),
        metadata: {
          ...metadataLike(invoiceRecord.metadata),
          ...(paidPayment?.metadata ?? {}),
        },
        status: paidPayment?.status ?? invoiceRecord.status ?? "paid",
        amount: paidPayment?.amount ?? invoiceRecord.amount,
        currency: paidPayment?.currency ?? invoiceRecord.currency,
        id: paidPayment?.id ?? invoiceRecord.id,
      },
    });
    return parsed ?? payment;
  }

  const remote = await fetchMoyasarPayment(payment.paymentId);
  if (!remote) {
    return payment;
  }

  return (
    parseGatewayPayload({
      id: payment.eventId,
      type: remote.status === "paid" ? "payment.paid" : `payment_${remote.status}`,
      data: remote,
    }) ?? payment
  );
}
