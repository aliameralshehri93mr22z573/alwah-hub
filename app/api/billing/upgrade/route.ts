import { NextResponse } from "next/server";
import { applyPaidPlan } from "@/lib/apply-billing";
import { paidPlanFrom } from "@/lib/checkout-session";
import { planOf } from "@/lib/plans";
import {
  DEMO_BOARDS_COOKIE,
  DEMO_PLAN_COOKIE,
  demoCookieOptions,
  isMoyasarConfigured,
  readDemoBoards,
  seedDemoBoards,
} from "@/lib/demo-session";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export async function POST(request: Request) {
  if (isMoyasarConfigured()) {
    return NextResponse.json(
      { error: "وضع المحاكاة يتوقف تلقائياً عند ضبط مفاتيح Moyasar." },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const planId = paidPlanFrom(body?.plan);
  if (!planId) {
    return NextResponse.json({ error: "باقة غير صالحة." }, { status: 400 });
  }

  const paymentId = `mock_${crypto.randomUUID()}`;
  const plan = planOf(planId);
  let userId: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "يلزم تسجيل الدخول." }, { status: 401 });
    }
    userId = user.id;
    await applyPaidPlan(
      {
        provider: "moyasar",
        eventId: paymentId,
        paymentId,
        paid: true,
        amountHalalas: plan.amountHalalas,
        currency: "SAR",
        userId,
        plan: planId,
      },
      {
        type: "payment.paid",
        mock: true,
        data: {
          id: paymentId,
          status: "paid",
          amount: plan.amountHalalas,
          currency: "SAR",
          metadata: { user_id: userId, plan: planId, product: "alwahhub" },
        },
      },
    );
  }

  const existingBoards = await readDemoBoards();
  const response = NextResponse.json({
    ok: true,
    mock: true,
    plan: planId,
    paymentId,
  });
  response.cookies.set(DEMO_PLAN_COOKIE, planId, demoCookieOptions());
  if (existingBoards.length === 0) {
    response.cookies.set(
      DEMO_BOARDS_COOKIE,
      JSON.stringify(seedDemoBoards()),
      demoCookieOptions(),
    );
  }
  return response;
}
