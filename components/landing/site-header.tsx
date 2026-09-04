"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const LINKS = [
  { href: "/#templates", label: "القوالب" },
  { href: "/#pricing", label: "الأسعار" },
  { href: "/#faq", label: "الأسئلة" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-slate-200 transition hover:bg-white/10"
          >
            دخول
          </Link>
          <Link
            href="/register"
            className="ms-1 rounded-full bg-brand px-4 py-2 font-semibold text-white hover:bg-brand/90"
          >
            ابدأ مجاناً
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "إغلاق القائمة" : "فتح القائمة"}</span>
        </button>
      </div>

      {open ? (
        <nav
          id="landing-mobile-menu"
          className="border-t border-white/10 bg-primary px-4 py-4 md:hidden"
        >
          <ul className="space-y-1 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-xl px-3 py-3 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block rounded-xl px-3 py-3 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                دخول
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-brand font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                ابدأ مجاناً
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/boards/demo"
                className="mt-2 flex min-h-12 items-center justify-center rounded-full border border-white/15"
                onClick={() => setOpen(false)}
              >
                مشاهدة عرض تجريبي
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
