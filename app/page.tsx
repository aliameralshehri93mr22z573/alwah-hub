import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Languages,
  Play,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { HeroBoardPreview } from "@/components/landing/hero-board-preview";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { TemplateShowcase } from "@/components/landing/template-showcase";
import { effectivePlan } from "@/lib/demo-session";
import { getLandingCopy } from "@/lib/i18n-server";
import { type PlanTier } from "@/lib/plans";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ar_SA",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function Home() {
  const { copy } = await getLandingCopy();
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
      current = await effectivePlan(data?.plan);
    }
  } else {
    current = await effectivePlan(null);
  }

  return (
    <div className="relative isolate min-h-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 top-0 h-80 w-80 rounded-full bg-brand/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 top-40 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
      />

      <SiteHeader />

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-accent">
              <Sparkles className="size-4" aria-hidden />
              {copy.heroBadge}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-[3.25rem]">
              {copy.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              {copy.heroBody}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-white transition hover:bg-brand/90"
              >
                {copy.heroCta}
                <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
              </Link>
              <Link
                href="/dashboard/boards/demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-base text-slate-100 transition hover:bg-white/10"
              >
                <Play className="size-4 text-accent" aria-hidden />
                {copy.heroDemo}
              </Link>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <Languages className="size-4 shrink-0 text-accent" />
                {copy.badgeArabic}
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="size-4 shrink-0 text-accent" />
                {copy.badgePay}
              </li>
              <li className="flex items-center gap-2">
                <Zap className="size-4 shrink-0 text-accent" />
                {copy.badgeFast}
              </li>
            </ul>
          </div>
          <HeroBoardPreview />
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Zap className="size-5 text-accent" />
              <h2 className="mt-3 font-bold">{copy.cardSpeedTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {copy.cardSpeedBody}
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <CreditCard className="size-5 text-accent" />
              <h2 className="mt-3 font-bold">{copy.cardPriceTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {copy.cardPriceBody}
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Smartphone className="size-5 text-accent" />
              <h2 className="mt-3 font-bold">{copy.cardMobileTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {copy.cardMobileBody}
              </p>
            </article>
          </div>
        </section>

        <section
          id="templates"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6"
        >
          <p className="text-sm font-semibold text-accent">
            {copy.templatesKicker}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {copy.templatesTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {copy.templatesBody}
          </p>
          <div className="mt-8">
            <TemplateShowcase />
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6"
        >
          <p className="text-sm font-semibold text-accent">{copy.pricingKicker}</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {copy.pricingTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {copy.pricingBody}
          </p>
          <div className="mt-8">
            <LandingPricing current={current} signedIn={signedIn} />
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto w-full max-w-3xl scroll-mt-24 px-4 pb-20 sm:px-6"
        >
          <p className="text-sm font-semibold text-accent">{copy.faqKicker}</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {copy.faqTitle}
          </h2>
          <div className="mt-8">
            <FaqAccordion />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
