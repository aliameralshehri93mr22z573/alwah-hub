"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { MARKETING_UI } from "@/lib/i18n-catalog";
import type { Locale } from "@/lib/i18n";
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
  const { locale } = useLocale();
  const ui = MARKETING_UI[locale];
  const isCurrent = current === plan;

  if (isCurrent) {
    return (
      <p className="mt-auto rounded-full bg-white/10 py-3 text-center text-sm text-accent">
        {ui.currentPlan}
      </p>
    );
  }

  if (!signedIn) {
    return (
      <Link
        href={{ pathname: "/register", query: { next: checkoutHref(plan) } }}
        className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
      >
        {ui.upgrade}
      </Link>
    );
  }

  return (
    <div className="mt-auto">
      <Link
        href={{ pathname: "/checkout", query: { plan } }}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand/90"
      >
        {ui.upgrade}
      </Link>
      <p className="mt-2 text-center text-xs text-slate-400">{ui.payHint}</p>
    </div>
  );
}

export function priceLabel(plan: PlanTier, locale: Locale = "ar") {
  const monthly = PLANS[plan].monthlySar;
  const ui = MARKETING_UI[locale];
  if (monthly === 0) {
    return { amount: "0", suffix: ui.currencyZero };
  }
  return { amount: String(monthly), suffix: ui.currencyMonth };
}
