import type { NormalizedPayment } from "@/lib/billing";
import { createAdminClient } from "@/utils/supabase/admin";

export type ApplyBillingResult =
  | { ok: true; duplicate: boolean; plan: NormalizedPayment["plan"] }
  | { ok: false; status: number; error: string };

export async function applyPaidPlan(
  payment: NormalizedPayment,
  payload: unknown,
): Promise<ApplyBillingResult> {
  if (!payment.paid || !payment.userId || !payment.plan) {
    return { ok: false, status: 422, error: "بيانات الدفع غير مكتملة." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      error: "SUPABASE_SERVICE_ROLE_KEY غير مضبوط.",
    };
  }

  const { data: byEvent } = await admin
    .from("billing_events")
    .select("id")
    .eq("id", payment.eventId)
    .maybeSingle();

  if (byEvent) {
    return { ok: true, duplicate: true, plan: payment.plan };
  }

  const { data: byPayment } = await admin
    .from("billing_events")
    .select("id")
    .eq("payment_id", payment.paymentId)
    .maybeSingle();

  const { error: profileError } = await admin.rpc("apply_billing_plan", {
    p_user: payment.userId,
    p_plan: payment.plan,
  });

  if (profileError) {
    const fallback = await admin
      .from("profiles")
      .update({ plan: payment.plan })
      .eq("id", payment.userId);
    if (fallback.error) {
      return { ok: false, status: 500, error: fallback.error.message };
    }
  }

  if (!byPayment) {
    const { error: insertError } = await admin.from("billing_events").insert({
      id: payment.eventId,
      provider: payment.provider,
      user_id: payment.userId,
      plan: payment.plan,
      payment_id: payment.paymentId,
      amount_halalas: payment.amountHalalas,
      payload,
    });
    if (insertError && insertError.code !== "23505") {
      return { ok: false, status: 500, error: insertError.message };
    }
  }

  return { ok: true, duplicate: Boolean(byPayment), plan: payment.plan };
}
