import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "هذا الرابط غير موجود في ألواح هب. عد إلى الصفحة الرئيسية أو ابدأ لوحتك مجاناً.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-full flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 top-10 h-80 w-80 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 bottom-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
      />

      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-sm font-semibold tracking-[0.3em] text-accent">٤٠٤</p>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
          الصفحة غير موجودة
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
          يبدو أن هذا الرابط تاه عن اللوحة. لا بأس — يمكنك العودة إلى الصفحة
          الرئيسية، أو إنشاء حساب والبدء بلوحة كانبان عربية خلال دقائق.
        </p>
        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand/90"
          >
            <Home className="size-4" aria-hidden />
            العودة للرئيسية
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            <Compass className="size-4" aria-hidden />
            ابدأ مجاناً
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
