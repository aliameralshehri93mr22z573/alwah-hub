import Link from "next/link";
import { PLANS, type PlanTier } from "@/lib/plans";

function checkoutHref(plan: Exclude<PlanTier, "free">) {
  return `/checkout?plan=${plan}`;
}

export function CheckoutButton({
  plan,
  current,
  signedIn,
}: {
  plan: Exclude<PlanTier, "free">;
  current: PlanTier;
  signedIn: boolean;
}) {
  const isCurrent = current === plan;

  if (isCurrent) {
    return (
      <p className="mt-auto rounded-full bg-white/10 py-3 text-center text-sm text-accent">
        باقتك الحالية
      </p>
    );
  }

  if (!signedIn) {
    return (
      <Link
        href={{ pathname: "/register", query: { next: checkoutHref(plan) } }}
        className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
      >
        ترقية
      </Link>
    );
  }

  return (
    <div className="mt-auto">
      <Link
        href={{ pathname: "/checkout", query: { plan } }}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand/90"
      >
        ترقية
      </Link>
      <p className="mt-2 text-center text-xs text-slate-400">
        الدفع عبر مدى والبطاقات و Apple Pay
      </p>
    </div>
  );
}

export function priceLabel(plan: PlanTier) {
  const monthly = PLANS[plan].monthlySar;
  if (monthly === 0) {
    return { amount: "0", suffix: "ر.س" };
  }
  return { amount: String(monthly), suffix: "ر.س / شهرياً" };
}
