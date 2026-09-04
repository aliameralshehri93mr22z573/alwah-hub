"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";

const COPY = {
  boards: {
    title: "وصلت لحد اللوحات",
    body: "الباقة المجانية تسمح بلوحتين فقط. رقِّ حسابك لإضافة ألواح بلا حد.",
  },
  members: {
    title: "وصلت لحد الأعضاء",
    body: "الباقة المجانية تسمح بثلاثة أعضاء في المساحة. رقِّ الحساب لدعوة الفريق.",
  },
  tasks: {
    title: "وصلت لحد المهام",
    body: "الباقة المجانية تسمح بخمسين مهمة نشطة. رقِّ الحساب لمتابعة العمل بلا انقطاع.",
  },
} as const;

export type UpgradeReason = keyof typeof COPY;

export function UpgradeModal({
  reason,
  onClose,
}: {
  reason: UpgradeReason | null;
  onClose: () => void;
}) {
  if (!reason) {
    return null;
  }

  const copy = COPY[reason];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="إغلاق"
        className="absolute inset-0 z-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1224] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute start-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="إغلاق النافذة"
        >
          <X className="size-4" />
        </button>
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand/20 text-accent">
          <Sparkles className="size-5" />
        </span>
        <h2 id="upgrade-title" className="mt-4 text-xl font-extrabold">
          {copy.title}
        </h2>
        <p className="mt-2 leading-7 text-slate-300">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white"
          >
            ترقية الحساب
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
