import { NextResponse } from "next/server";
import { PAID_PLANS } from "@/lib/plans";
import { paymentProvider } from "@/lib/billing";
import { siteUrl } from "@/lib/site";
import {
  createCheckoutUrl,
  paidPlanFrom,
  resolveCheckoutPlan,
  wantsRedirect,
} from "@/lib/checkout-session";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

async function handleCheckout(request: Request) {
  const origin = siteUrl();
  const redirectMode = wantsRedirect(request);
  const fail = (status: number, error: string, login = false) => {
    if (redirectMode) {
      const target = login
        ? `${origin}/login?next=/checkout`
        : `${origin}/pricing?error=${encodeURIComponent(error)}`;
      return NextResponse.redirect(target);
    }
    return NextResponse.json({ error }, { status });
  };

  if (!isSupabaseConfigured()) {
    return fail(503, "اربط Supabase أولاً ثم أعد المحاولة.");
  }

  const planId = paidPlanFrom(await resolveCheckoutPlan(request));
  if (!planId) {
    return fail(400, "باقة غير صالحة.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fail(401, "يلزم تسجيل الدخول.", true);
  }

  const result = await createCheckoutUrl(planId, user.id);
  if (!result.ok) {
    return fail(result.status, result.error);
  }

  if (redirectMode) {
    return NextResponse.redirect(result.checkoutUrl);
  }

  return NextResponse.json({
    checkoutUrl: result.checkoutUrl,
    provider: result.provider,
    methods: ["mada", "apple_pay"],
  });
}

export async function POST(request: Request) {
  return handleCheckout(request);
}

export async function GET(request: Request) {
  const plan = new URL(request.url).searchParams.get("plan");
  if (plan) {
    return handleCheckout(request);
  }

  return NextResponse.json({
    provider: paymentProvider(),
    methods: ["mada", "apple_pay"],
    plans: PAID_PLANS.map((item) => ({
      id: item.id,
      name: item.name,
      monthlySar: item.monthlySar,
    })),
  });
}
