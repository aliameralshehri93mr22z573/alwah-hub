import Link from "next/link";
import { Check } from "lucide-react";
import { CheckoutButton, priceLabel } from "@/components/checkout-button";
import { PLANS, type PlanTier } from "@/lib/plans";

const ORDER: PlanTier[] = ["free", "solo", "team", "agency"];

export function LandingPricing({
  current,
  signedIn,
}: {
  current: PlanTier;
  signedIn: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <h3 className="text-xl font-bold">{plan.name}</h3>
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
                href="/register"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 text-sm hover:bg-white/10"
              >
                ابدأ مجاناً
              </Link>
            ) : (
              <div className="mt-6 flex flex-1 flex-col justify-end">
                <CheckoutButton plan={id} current={current} signedIn={signedIn} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
