"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Kanban, LayoutDashboard } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/dashboard/boards/demo", label: "الألواح", icon: Kanban },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/pricing", label: "الباقات", icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();

  const showOnApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/boards");

  if (!showOnApp) {
    return null;
  }

  return (
    <>
      <div className="h-20 shrink-0 md:hidden" aria-hidden />
      <nav
      aria-label="تنقل الجوال"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-primary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);
          const boardsActive =
            href.includes("/boards") && pathname.includes("/boards");
          const isActive = href.includes("/boards") ? boardsActive : active;

          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] ${
                  isActive ? "text-accent" : "text-slate-400"
                }`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
