"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, GraduationCap, Heart, Rocket, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { MARKETING_UI, TEMPLATE_LANDING } from "@/lib/i18n-catalog";
import { TEMPLATE_TYPES, type TemplateType } from "@/lib/templates";

const ICONS = {
  sales: TrendingUp,
  dev: Rocket,
  edu: GraduationCap,
  wedding: Heart,
} as const;

export function TemplateShowcase() {
  const { locale } = useLocale();
  const [active, setActive] = useState<TemplateType>("sales");
  const catalog = TEMPLATE_LANDING[locale];
  const ui = MARKETING_UI[locale];
  const selected = catalog[active];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TEMPLATE_TYPES.map((type) => {
          const Icon = ICONS[type];
          const copy = catalog[type];
          const isActive = active === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActive(type)}
              aria-pressed={isActive}
              className={`rounded-3xl border p-5 text-start transition ${
                isActive
                  ? "border-brand bg-brand/20 shadow-lg shadow-brand/20"
                  : "border-white/10 bg-white/5 hover:border-accent/40 hover:bg-white/10"
              }`}
            >
              <Icon className="size-6 text-accent" aria-hidden />
              <h3 className="mt-4 text-lg font-bold">{copy.heading}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{copy.audience}</p>
            </button>
          );
        })}
      </div>

      <article className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-accent">{selected.heading}</p>
            <h3 className="mt-1 text-xl font-bold">{selected.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              {selected.description} {ui.previewNote}
            </p>
          </div>
          <Link
            href="/dashboard/boards/demo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand/90"
          >
            {ui.tryTemplate}
            <ChevronLeft className="size-4 ltr:rotate-180" aria-hidden />
          </Link>
        </div>
        <ol className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">
          {selected.columns.map((column, index) => (
            <li
              key={column}
              className="min-w-[11rem] snap-start rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <p className="text-xs text-slate-400">{ui.column(index + 1)}</p>
              <p className="mt-2 font-semibold">{column}</p>
              {index === 0 ? (
                <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs leading-6 text-slate-300">
                  {selected.sampleTask}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}
