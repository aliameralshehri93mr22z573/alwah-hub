import Link from "next/link";
import { Kanban, Shield, Smartphone } from "lucide-react";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { PLAN_I18N } from "@/lib/i18n-catalog";
import { getLandingCopy } from "@/lib/i18n-server";
import { type PlanTier } from "@/lib/plans";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { effectivePlan } from "@/lib/demo-session";

type PricingPageProps = {
  searchParams: Promise<{ status?: string; error?: string; reason?: string }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { status, error, reason } = await searchParams;
  const { locale, copy } = await getLandingCopy();
  let current: PlanTier = "free";
  let signedIn = !isSupabaseConfigured();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      const plan = data?.plan;
      current = await effectivePlan(
        plan === "solo" || plan === "team" || plan === "agency" ? plan : "free",
      );
    }
  } else {
    current = await effectivePlan(null);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-16">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-300">
            <Kanban className="size-4 text-accent" />
            {copy.brand}
          </Link>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            {copy.pricingTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            {copy.pricingBody}
          </p>
        </div>
        <p className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-accent">
          {PLAN_I18N[locale][current].name}
        </p>
      </header>

      {status === "return" ? (
        <p className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          إذا اكتمل الدفع ستتحدث الباقة خلال لحظات. حدّث الصفحة إن لم يظهر التغيير.
        </p>
      ) : null}
      {error ? (
        <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {reason === "boards" || reason === "members" ? (
        <p className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm">
          {reason === "boards"
            ? "الباقة المجانية تسمح بلوحتين فقط. اختر باقة للترقية."
            : "الباقة المجانية تسمح بثلاثة أعضاء فقط. اختر باقة للترقية."}
        </p>
      ) : null}

      <LandingPricing current={current} signedIn={signedIn} />

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <Smartphone className="mb-3 size-5 text-accent" />
          <h3 className="font-bold">مدى و Apple Pay</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            زر الترقية يفتح{" "}
            <span dir="ltr" className="text-accent">
              /checkout?plan=
            </span>{" "}
            مع نموذج Moyasar لمدى والبطاقات الائتمانية و Apple Pay.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <Shield className="mb-3 size-5 text-accent" />
          <h3 className="font-bold">تحديث تلقائي للباقة</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            بعد الدفع يحدّث الويب هوك حقل الباقة في ملفك دون تدخل يدوي.
          </p>
        </article>
      </section>
    </main>
  );
}
