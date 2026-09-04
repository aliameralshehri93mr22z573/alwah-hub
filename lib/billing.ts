import { createHmac, timingSafeEqual } from "node:crypto";
import { isPlanTier, planOf, type PlanTier } from "@/lib/plans";
import { siteUrl as canonicalSiteUrl } from "@/lib/site";

export type PaymentProvider = "moyasar" | "tap";

export type NormalizedPayment = {
  provider: PaymentProvider;
  eventId: string;
  paymentId: string;
  paid: boolean;
  amountHalalas: number;
  currency: string;
  userId: string | null;
  plan: PlanTier | null;
};

export const MOYASAR_PAID_EVENTS = new Set([
  "payment.paid",
  "payment_paid",
  "payment.captured",
  "payment_captured",
  "invoice.paid",
  "invoice_paid",
]);

export function paymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "tap" ? "tap" : "moyasar";
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function hmacDigest(secret: string, payload: string, encoding: "hex" | "base64") {
  return createHmac("sha256", secret).update(payload).digest(encoding);
}

function headerValues(headers: Headers, names: string[]) {
  return names
    .flatMap((name) => headers.get(name)?.split(",") ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/^sha256=/i, ""));
}

function webhookSecrets() {
  return [
    process.env.PAYMENT_WEBHOOK_SECRET,
    process.env.MOYASAR_WEBHOOK_SECRET,
    process.env.TAP_WEBHOOK_SECRET,
  ].filter((value): value is string => Boolean(value));
}

export function verifyWebhookSignature(
  rawBody: string,
  headers: Headers,
): boolean {
  const secrets = webhookSecrets();
  if (secrets.length === 0) {
    return false;
  }

  const candidates = [
    ...headerValues(headers, [
      "x-moyasar-signature",
      "moyasar-signature",
      "x-signature",
      "hashstring",
      "hashString",
      "x-tap-signature",
    ]),
    headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "",
  ].filter(Boolean);

  for (const secret of secrets) {
    const hex = hmacDigest(secret, rawBody, "hex");
    const base64 = hmacDigest(secret, rawBody, "base64");
    if (
      candidates.some(
        (value) =>
          equal(value.toLowerCase(), hex.toLowerCase()) ||
          equal(value, base64) ||
          equal(value, secret),
      )
    ) {
      return true;
    }
  }

  try {
    const parsed = JSON.parse(rawBody) as { secret_token?: unknown };
    const token =
      typeof parsed.secret_token === "string" ? parsed.secret_token : "";
    if (token && secrets.some((secret) => equal(token, secret))) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function metadataOf(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      String(item ?? ""),
    ]),
  );
}

export function pickPlan(metadata: Record<string, string>): PlanTier | null {
  const plan = metadata.plan ?? metadata.plan_tier ?? "";
  return isPlanTier(plan) && plan !== "free" ? plan : null;
}

export function pickUser(metadata: Record<string, string>): string | null {
  return metadata.user_id || metadata.userId || metadata.uid || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function firstPaidPayment(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const records = value
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => Boolean(item));
  return (
    records.find((item) => {
      const status = String(item.status ?? "").toLowerCase();
      return status === "paid" || status === "captured";
    }) ??
    records[0] ??
    null
  );
}

export function parseGatewayPayload(body: unknown): NormalizedPayment | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const root = body as Record<string, unknown>;
  const nested = asRecord(root.data) ?? root;
  const invoicePayment = firstPaidPayment(nested.payments);
  const source = invoicePayment ?? nested;

  const moyasarType = String(root.type ?? root.event_type ?? "")
    .trim()
    .toLowerCase();
  const tapStatus = String(source.status ?? nested.status ?? root.status ?? "").toUpperCase();
  const moyasarStatus = String(source.status ?? nested.status ?? "").toLowerCase();

  const isMoyasar =
    moyasarType.startsWith("payment") ||
    moyasarType.startsWith("invoice") ||
    moyasarStatus === "paid" ||
    nested.source !== undefined ||
    invoicePayment !== null;
  const isTap =
    String(root.object ?? nested.object ?? source.object ?? "") === "charge" ||
    tapStatus === "CAPTURED" ||
    nested.gateway_response !== undefined;

  const metadata = {
    ...metadataOf(nested.metadata ?? root.metadata),
    ...metadataOf(source.metadata),
  };
  const amountRaw = Number(source.amount ?? nested.amount ?? root.amount ?? 0);
  const currency = String(source.currency ?? nested.currency ?? root.currency ?? "SAR");
  const paymentId = String(source.id ?? nested.id ?? root.id ?? "");
  const eventId = String(root.id ?? paymentId);

  if (!paymentId) {
    return null;
  }

  if (isTap && !isMoyasar) {
    return {
      provider: "tap",
      eventId,
      paymentId,
      paid: tapStatus === "CAPTURED" || tapStatus === "PAID",
      amountHalalas: Math.round(amountRaw * (amountRaw < 1000 ? 100 : 1)),
      currency,
      userId: pickUser(metadata),
      plan: pickPlan(metadata),
    };
  }

  return {
    provider: "moyasar",
    eventId,
    paymentId,
    paid:
      MOYASAR_PAID_EVENTS.has(moyasarType) ||
      moyasarStatus === "paid" ||
      moyasarStatus === "captured",
    amountHalalas: amountRaw,
    currency,
    userId: pickUser(metadata),
    plan: pickPlan(metadata),
  };
}

export function amountMatchesPlan(plan: PlanTier, amountHalalas: number) {
  return planOf(plan).amountHalalas === amountHalalas;
}

export function siteUrl() {
  return canonicalSiteUrl();
}

export function originFromHeaders(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  return siteUrl();
}

