import Link from "next/link";
import { Check, Kanban, Shield, Smartphone } from "lucide-react";
import { CheckoutButton, priceLabel } from "@/components/checkout-button";
import { PLANS, type PlanTier } from "@/lib/plans";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { effectivePlan } from "@/lib/demo-session";

const ORDER: PlanTier[] = ["free", "solo", "team", "agency"];

type PricingPageProps = {
  searchParams: Promise<{ status?: string; error?: string; reason?: string }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { status, error, reason } = await searchParams;
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
            ألواح هب
          </Link>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            الأسعار والاشتراكات
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            أربع باقات عربية، والدفع المحلي عبر مدى و Apple Pay. تُحدَّث باقتك
            تلقائياً بعد نجاح التحويل.
          </p>
        </div>
        <p className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-accent">
          باقتك الآن: {PLANS[current].name}
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((id) => {
          const plan = PLANS[id];
          const price = priceLabel(id);
          return (
            <article
              key={id}
              className={`flex min-h-full flex-col rounded-3xl border p-5 sm:p-6 ${
                plan.highlighted
                  ? "border-brand bg-brand/15 shadow-lg shadow-brand/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.highlighted ? (
                <p className="mb-2 text-xs font-semibold text-accent">الأكثر اختياراً</p>
              ) : null}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-slate-300">{plan.tagline}</p>
              <p className="mt-4 flex flex-wrap items-baseline gap-1">
                <span className="text-4xl font-extrabold">{price.amount}</span>
                <span className="text-sm text-slate-300">{price.suffix}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              {id === "free" ? (
                <Link
                  href={signedIn ? "/dashboard" : "/register"}
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 text-sm hover:bg-white/10"
                >
                  {signedIn ? "العودة للوحة التحكم" : "ابدأ مجاناً"}
                </Link>
              ) : (
                <div className="mt-6 flex flex-1 flex-col justify-end">
                  <CheckoutButton plan={id} current={current} signedIn={signedIn} />
                </div>
              )}
            </article>
          );
        })}
      </section>

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
