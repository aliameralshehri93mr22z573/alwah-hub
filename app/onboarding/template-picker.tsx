"use client";

import { useState, useTransition } from "react";
import { Check, GraduationCap, Heart, Rocket, TrendingUp } from "lucide-react";
import { applyBoardTemplate } from "@/app/onboarding/actions";
import {
  DEFAULT_TEMPLATE,
  TEMPLATE_LIST,
  type TemplateType,
} from "@/lib/templates";

const ICONS = {
  sales: TrendingUp,
  dev: Rocket,
  edu: GraduationCap,
  wedding: Heart,
} as const;

export function TemplatePicker() {
  const [selected, setSelected] = useState<TemplateType>(DEFAULT_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(templateType: TemplateType) {
    setError(null);
    startTransition(async () => {
      const result = await applyBoardTemplate(templateType);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {TEMPLATE_LIST.map((template) => {
          const Icon = ICONS[template.type];
          const active = selected === template.type;

          return (
            <button
              key={template.type}
              type="button"
              onClick={() => setSelected(template.type)}
              className={`rounded-2xl border p-5 text-start transition ${
                active
                  ? "border-brand bg-brand/15 ring-2 ring-brand"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <span className="mb-3 flex items-center justify-between">
                <Icon className="size-6 text-accent" aria-hidden />
                {active ? <Check className="size-5 text-accent" /> : null}
              </span>
              <h2 className="text-lg font-bold">{template.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {template.description}
              </p>
              <ol className="mt-4 flex flex-wrap gap-2">
                {template.columns.map((column) => (
                  <li
                    key={column}
                    className="rounded-full bg-black/20 px-3 py-1 text-xs text-slate-200"
                  >
                    {column}
                  </li>
                ))}
              </ol>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() => apply(selected)}
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
        >
          {pending ? "جارٍ تجهيز اللوحة..." : "استخدم هذا القالب"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => apply(DEFAULT_TEMPLATE)}
          className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
        >
          تطبيق القالب الافتراضي
        </button>
      </div>
    </div>
  );
}
