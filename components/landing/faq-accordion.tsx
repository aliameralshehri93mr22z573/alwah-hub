import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  {
    id: "payments",
    question: "ما طرق الدفع المحلية المتاحة؟",
    answer:
      "ندعم مدى، والبطاقات الائتمانية (Visa وMastercard)، وApple Pay عبر Moyasar. المبالغ بالريال السعودي، وبعد نجاح الدفع تُفعَّل الباقة فوراً على حسابك.",
  },
  {
    id: "export",
    question: "هل يمكنني تصدير بياناتي؟",
    answer:
      "بياناتك ملكك. يمكنك عرض المهام في وضع الجدول ونسخها عند الحاجة. إن احتجت ملفاً كاملاً للدعم أو الأرشفة تواصل معنا وسنوفّر لك نسخة من مساحة العمل.",
  },
  {
    id: "mobile",
    question: "هل تجربة الجوال مكتملة؟",
    answer:
      "نعم، الواجهة عربية من اليمين لليسار، وألواح كانبان تُمرّر أفقياً على الشاشة وتُفتح من الأسفل حتى تدير عملك بأسهل ما يمكن.",
  },
  {
    id: "arabic",
    question: "لماذا ألواح هب بدل Monday أو ClickUp؟",
    answer:
      "تلك الأدوات قوية لكنها معقّدة وغالباً أغلى، وواجهتها ليست عربية أصيلة. ألواح هب تبدأ خلال دقائق، بأسعار واضحة بالريال، ودفع محلي، دون أن تترجم قوائمك يدوياً كل يوم.",
  },
] as const;

export function FaqAccordion() {
  return (
    <div className="space-y-3">
      {QUESTIONS.map((item, index) => (
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
