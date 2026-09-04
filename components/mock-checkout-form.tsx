"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { planOf, type PlanTier } from "@/lib/plans";

export function MockCheckoutForm({
  plan,
}: {
  plan: Exclude<PlanTier, "free">;
}) {
  const definition = planOf(plan);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPay() {
    setError(null);
    setPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));

    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        paymentId?: string;
        error?: string;
      };
      if (!response.ok || !payload.paymentId) {
        throw new Error(payload.error ?? "تعذّرت الترقية التجريبية.");
      }
      const target = new URL("/billing/success", window.location.origin);
      target.searchParams.set("payment_id", payload.paymentId);
      target.searchParams.set("plan", plan);
      target.searchParams.set("mock", "1");
      window.location.assign(target.toString());
    } catch (caught) {
      setPending(false);
      setError(
        caught instanceof Error ? caught.message : "تعذّرت الترقية التجريبية.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-7">
        وضع تجريبي: لا توجد مفاتيح Moyasar، ولن يُخصم مبلغ حقيقي. بعد الدفع
        التجريبي تُفعَّل باقة {definition.name} فوراً.
      </p>

      <div className="overflow-hidden rounded-3xl bg-white p-5 text-slate-900 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between">
          <MadaMark />
          <span className="text-xs font-semibold tracking-wide text-emerald-700">
            بطاقة مدى تجريبية
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-4 text-white shadow-inner">
          <p className="text-xs opacity-80">البطاقة</p>
          <p className="mt-3 font-mono text-lg tracking-[0.2em]" dir="ltr">
            4464 0400 0000 0007
          </p>
          <div className="mt-4 flex items-end justify-between text-xs">
            <div>
              <p className="opacity-70">حامل البطاقة</p>
              <p className="mt-1 font-semibold">محمد التجريبي</p>
            </div>
            <div className="text-end">
              <p className="opacity-70">تنتهي</p>
              <p className="mt-1 font-mono">12 / 29</p>
            </div>
          </div>
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onPay();
          }}
        >
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block text-slate-600">رقم البطاقة</span>
            <input
              readOnly
              value="4464 0400 0000 0007"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-slate-800"
              dir="ltr"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-600">تاريخ الانتهاء</span>
            <input
              readOnly
              value="12 / 29"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-slate-800"
              dir="ltr"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-600">رمز الأمان</span>
            <input
              readOnly
              value="123"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-slate-800"
              dir="ltr"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="sm:col-span-2 mt-1 inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {pending ? "جارٍ معالجة البنك…" : "إتمام دفع تجريبي ببطاقة مدى"}
          </button>
        </form>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <p className="flex items-start gap-2 text-xs leading-6 text-slate-400">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        المحاكاة تنتظر ثانية واحدة ثم تحدّث الباقة عبر مسار الترقية التجريبي.
      </p>
    </div>
  );
}

function MadaMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="36" height="24" viewBox="0 0 36 24" aria-hidden>
        <rect width="36" height="24" rx="6" fill="#00A651" />
        <text
          x="18"
          y="16"
          textAnchor="middle"
          fill="white"
          fontSize="9"
          fontWeight="700"
          fontFamily="Cairo, sans-serif"
        >
          مدى
        </text>
      </svg>
      <span className="text-sm font-bold text-emerald-800">مدى</span>
    </span>
  );
}
