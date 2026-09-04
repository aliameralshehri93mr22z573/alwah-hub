"use client";

import Link from "next/link";
import { planOf, type PlanTier } from "@/lib/plans";

export function BillingSuccessView({
  plan,
  paymentId,
  mock = false,
}: {
  plan?: Exclude<PlanTier, "free"> | null;
  paymentId: string;
  mock?: boolean;
}) {
  const definition = plan ? planOf(plan) : null;

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 pb-28 text-center md:pb-16">
      <div className="success-check" aria-hidden>
        <svg viewBox="0 0 52 52">
          <circle className="success-check-circle" cx="26" cy="26" r="25" fill="none" />
          <path
            className="success-check-mark"
            fill="none"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>
      </div>
      <p className="mt-8 text-sm font-semibold text-accent">
        {mock ? "تمت الترقية بنجاح (وضع تجريبي)" : "تم تفعيل الباقة فوراً"}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">الدفع اكتمل بنجاح</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
        {definition ? (
          <>
            باقة <strong>{definition.name}</strong> أصبحت نشطة على حسابك الآن.
            يمكنك العودة إلى لوحة التحكم والبدء فوراً بلا حدود الباقة السابقة.
          </>
        ) : (
          <>
            استلمنا الدفع ونفعّل باقتك على الحساب فوراً. ادخل لوحة التحكم
            لمتابعة العمل بالباقة الجديدة.
          </>
        )}
      </p>
      <p className="mt-3 text-xs text-slate-500" dir="ltr">
        {paymentId}
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-white hover:bg-brand/90"
      >
        العودة إلى لوحة التحكم
      </Link>
    </main>
  );
}

export function BillingReturnView({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 pb-28 text-center md:pb-16">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">{body}</p>
      <Link
        href={href}
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-white hover:bg-brand/90"
      >
        {action}
      </Link>
    </main>
  );
}
