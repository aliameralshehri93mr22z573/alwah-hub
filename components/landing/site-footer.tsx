"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export function SiteFooter() {
  const { copy } = useLocale();

  return (
    <footer className="border-t border-white/10 bg-[#0B1224]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{copy.brand}</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">
            {copy.footerBlurb}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">{copy.footerPlatform}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <a href="/#templates" className="hover:text-white">
                {copy.footerTemplates}
              </a>
            </li>
            <li>
              <a href="/#pricing" className="hover:text-white">
                {copy.footerPricing}
              </a>
            </li>
            <li>
              <Link href="/dashboard/boards/demo" className="hover:text-white">
                {copy.footerDemo}
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                {copy.footerRegister}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">{copy.footerLegal}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <Link href="/terms" className="hover:text-white">
                {copy.footerTerms}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                {copy.footerPrivacy}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>{copy.footerRights}</span>
          <span dir="ltr">AlwahHub</span>
        </p>
      </div>
    </footer>
  );
}
