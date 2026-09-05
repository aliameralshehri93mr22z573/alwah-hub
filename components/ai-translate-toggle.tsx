"use client";

import { Languages } from "lucide-react";
import { hasMockTranslation, mockTranslate } from "@/lib/mock-translate";

type AiTranslateToggleProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label: string;
  hint: string;
};

export function AiTranslateToggle({
  enabled,
  onToggle,
  label,
  hint,
}: AiTranslateToggleProps) {
  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3">
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => onToggle(!enabled)}
        className="flex w-full items-center justify-between gap-3 text-start"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Languages className="size-4 text-accent" aria-hidden />
          {label}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            enabled ? "bg-brand text-white" : "bg-white/10 text-slate-300"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </span>
      </button>
      <p className="mt-2 text-xs leading-6 text-slate-400">{hint}</p>
    </div>
  );
}

export function TranslatedText({
  text,
  enabled,
  className = "",
}: {
  text: string;
  enabled: boolean;
  className?: string;
}) {
  if (!enabled) {
    return <span className={className}>{text}</span>;
  }

  const translated = mockTranslate(text);
  const preview = hasMockTranslation(text);

  return (
    <span className={className} dir={preview ? "ltr" : undefined}>
      {translated}
    </span>
  );
}
