import Link from "next/link";
import { Sparkles } from "lucide-react";
import { planOf, type PlanTier } from "@/lib/plans";

export function PlanBanner({
  plan,
  canManagePlan = true,
}: {
  plan: PlanTier;
  canManagePlan?: boolean;
}) {
  const definition = planOf(plan);
  const isFree = plan === "free";
  const label = canManagePlan ? "باقتك الحالية" : "باقة مساحة العمل";

  return (
    <div
      className={`border-b px-4 py-3 sm:px-6 ${
        isFree
          ? "border-amber-300/20 bg-amber-300/10 text-amber-50"
          : "border-accent/20 bg-accent/10 text-slate-100"
      }`}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm leading-6 sm:items-center">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent sm:mt-0" />
          <span>
            {label}: <strong>{definition.name}</strong>
            {isFree && canManagePlan
              ? " — حتى لوحتين و3 أعضاء. رقِّ الحساب لإزالة الحدود."
              : isFree
                ? " — حتى لوحتين و3 أعضاء."
                : canManagePlan
                  ? " — شكراً لدعمك ألواح هب."
                  : "."}
          </span>
        </p>
        {canManagePlan ? (
          isFree ? (
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
            >
              ترقية الحساب
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex shrink-0 text-sm text-accent hover:underline"
            >
              إدارة الباقة
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
