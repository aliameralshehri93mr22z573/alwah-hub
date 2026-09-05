"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { id: Locale; label: string }[] = [
  { id: "ar", label: "AR" },
  { id: "en", label: "EN" },
];

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, pending, setLocale, app } = useLocale();

  return (
    <div
      role="group"
      aria-label={app.language}
      className={`inline-flex rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-semibold ${
        compact ? "" : "text-sm"
      }`}
    >
      {OPTIONS.map((option) => {
        const active = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={pending}
            aria-pressed={active}
            onClick={() => setLocale(option.id)}
            className={`min-w-10 rounded-full px-2.5 py-1.5 transition ${
              active
                ? "bg-brand text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
