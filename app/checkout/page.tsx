import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Kanban } from "lucide-react";
import {
  MoyasarCheckoutForm,
  type MoyasarCheckoutConfig,
} from "@/components/moyasar-checkout-form";
import { MockCheckoutForm } from "@/components/mock-checkout-form";
import { originFromHeaders } from "@/lib/billing";
import { paidPlanFrom } from "@/lib/checkout-session";
import { isMoyasarConfigured } from "@/lib/demo-session";
import { planOf } from "@/lib/plans";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

type CheckoutPageProps = {
  searchParams: Promise<{ plan?: string }>;
};

export const metadata = {
  title: "إتمام الدفع",
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { plan: planQuery } = await searchParams;
  const planId = paidPlanFrom(planQuery ?? "");
  if (!planId) {
    redirect("/pricing");
  }

  const plan = planOf(planId);
  const headerList = await headers();
  const origin = originFromHeaders(headerList);
  const callbackUrl = `${origin}/billing/success`;
  const mockMode = !isMoyasarConfigured();
  const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY ?? "";
  let userId = "";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/checkout?plan=${planId}`)}`);
    }
    userId = user.id;
  }

  const config: MoyasarCheckoutConfig = {
    plan: planId,
    amountHalalas: plan.amountHalalas,
    userId,
    publishableKey,
    callbackUrl,
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-16">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300">
        <Kanban className="size-4 text-accent" />
        ألواح هب
      </Link>
      <p className="text-sm text-accent">الدفع الآمن</p>
      <h1 className="mt-2 text-3xl font-extrabold">إتمام اشتراك {plan.name}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        {mockMode
          ? `محاكاة دفع مدى لباقة ${plan.name} بمبلغ ${plan.monthlySar} ر.س — بدون خصم حقيقي.`
          : `ادفع ${plan.monthlySar} ر.س شهرياً بمدى أو بطاقة ائتمان أو Apple Pay. بعد نجاح العملية تُفعَّل الباقة فوراً.`}
      </p>

      {!userId && !mockMode ? (
        <p className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-7">
          اربط Supabase وسجّل الدخول قبل الدفع حتى يُحدَّث حقل الباقة في ملفك
          تلقائياً بعد نجاح Moyasar.
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-slate-300">الباقة</span>
          <strong>{plan.name}</strong>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="text-slate-300">المبلغ</span>
          <strong>
            {plan.monthlySar}{" "}
            <span className="text-sm font-normal text-slate-300">ر.س / شهرياً</span>
          </strong>
        </div>
      </div>

      <section className="mt-6">
        {mockMode ? (
          <MockCheckoutForm plan={planId} />
        ) : (
          <MoyasarCheckoutForm config={config} />
        )}
      </section>

      <p className="mt-6 text-center text-sm">
        <Link href="/pricing" className="text-slate-400 hover:text-accent">
          اختيار باقة أخرى
        </Link>
      </p>
    </main>
  );
}
