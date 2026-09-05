"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { MARKETING_UI, TEMPLATE_LANDING } from "@/lib/i18n-catalog";

export function HeroBoardPreview() {
  const { locale } = useLocale();
  const ui = MARKETING_UI[locale];
  const sales = TEMPLATE_LANDING[locale].sales;
  const columns = [
    { title: sales.columns[0], tasks: [ui.heroTasks[0], ui.heroTasks[1]] },
    { title: sales.columns[1], tasks: [ui.heroTasks[2]] },
    { title: sales.columns[3] ?? sales.columns[2], tasks: [ui.heroTasks[3]] },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B1224] p-4 shadow-2xl shadow-brand/20 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{ui.heroBoardTitle}</p>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
          {ui.heroBoardBadge}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {columns.map((column) => (
          <div
            key={column.title}
            className="min-w-[9.5rem] flex-1 rounded-2xl bg-white/5 p-3"
          >
            <p className="text-xs text-slate-400">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.tasks.map((task) => (
                <li
                  key={task}
                  className="rounded-xl border border-white/10 bg-primary/80 px-3 py-2 text-xs leading-5"
                >
                  {task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400">
        <Check className="size-3.5 text-accent" />
        {ui.heroBoardFooter}
      </p>
    </div>
  );
}
