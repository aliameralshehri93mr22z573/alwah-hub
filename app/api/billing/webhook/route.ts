import { NextResponse } from "next/server";
import { applyPaidPlan } from "@/lib/apply-billing";
import {
  amountMatchesPlan,
  parseGatewayPayload,
  verifyWebhookSignature,
} from "@/lib/billing";
import { hydratePaymentFromMoyasar } from "@/lib/moyasar";

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, request.headers)) {
    return NextResponse.json({ error: "توقيع غير صالح." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "نص غير صالح." }, { status: 400 });
  }

  const parsed = parseGatewayPayload(json);
  if (!parsed) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const payment = await hydratePaymentFromMoyasar(parsed, json);
  if (!payment.paid || !payment.userId || !payment.plan) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (!amountMatchesPlan(payment.plan, payment.amountHalalas)) {
    return NextResponse.json(
      { error: "المبلغ لا يطابق الباقة." },
      { status: 409 },
    );
  }

  const result = await applyPaidPlan(payment, json);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    received: true,
    plan: result.plan,
    duplicate: result.duplicate,
  });
}
