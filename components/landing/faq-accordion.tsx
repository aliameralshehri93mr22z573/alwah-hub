"use client";

import { ChevronDown } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export function FaqAccordion() {
  const { copy } = useLocale();

  return (
    <div className="space-y-3">
      {copy.faqs.map((item, index) => (
        <details
          key={item.id}
          name="landing-faq"
          open={index === 0}
          className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-start text-base font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-5 shrink-0 text-accent transition group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-slate-300">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
