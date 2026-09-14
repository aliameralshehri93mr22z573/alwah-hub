import {
  CheckCircle2,
  Gauge,
  Layers3,
  Loader,
} from "lucide-react";
import type { WorkspaceKpis } from "@/lib/workspace-kpis";

function ProgressBar({
  value,
  tone = "brand",
}: {
  value: number;
  tone?: "brand" | "accent" | "done";
}) {
  const width = Math.min(100, Math.max(0, value));
  const fill =
    tone === "done"
      ? "bg-emerald-400"
      : tone === "accent"
        ? "bg-accent"
        : "bg-brand";

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
      <div
        className={`h-full rounded-full ${fill}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function DashboardKpis({
  kpis,
  audience = "admin",
}: {
  kpis: WorkspaceKpis;
  audience?: "admin" | "member";
}) {
  const isMember = audience === "member";
  const cards = isMember
    ? [
        {
          label: "إجمالي مهامي",
          value: String(kpis.total),
          hint: "المهام المسندة إلي في ألواح المدرسة",
          icon: Layers3,
        },
        {
          label: "نسبة إنجازي الشخصية",
          value: `${kpis.percent}%`,
          hint: `${kpis.done} من ${kpis.total} مهمة مسندة`,
          icon: Gauge,
          bar: kpis.percent,
        },
        {
          label: "مهامي المنجزة",
          value: String(kpis.done),
          hint: "من المهام المسندة إلي",
          icon: CheckCircle2,
        },
      ]
    : [
        {
          label: "إجمالي المهام",
          value: String(kpis.total),
          hint: "في كل ألواح المدرسة",
          icon: Layers3,
        },
        {
          label: "نسبة الإنجاز",
          value: `${kpis.percent}%`,
          hint: `${kpis.done} من ${kpis.total} مهمة`,
          icon: Gauge,
          bar: kpis.percent,
        },
        {
          label: "المهام المنجزة",
          value: String(kpis.done),
          hint: "في عمود تم",
          icon: CheckCircle2,
        },
        {
          label: "قيد التنفيذ",
          value: String(kpis.inProgress),
          hint: "في عمود جارٍ",
          icon: Loader,
        },
      ];

  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-accent">
          {isMember ? "مهامي المسندة إلي" : "تحليل المدرسة"}
        </p>
        <h2 className="mt-1 text-xl font-bold">
          {isMember ? "مؤشرات أدائي" : "مؤشرات الأداء والإنجاز"}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          {isMember
            ? "تُحسب الأرقام من المهام المسندة إليك فقط داخل مساحة عمل المدرسة."
            : "تُحسب الأرقام تلقائياً من المهام الفعلية في ألواح مساحة العمل."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-white/10 bg-black/25 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
              </div>
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/20 text-accent">
                <card.icon className="size-5" aria-hidden />
              </span>
            </div>
            {card.bar !== undefined ? <ProgressBar value={card.bar} /> : null}
          </article>
        ))}
      </div>

      {isMember ? null : (
        <article className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
          <h3 className="font-bold">تقدم الأقسام</h3>
          <p className="mt-1 text-sm text-slate-400">
            نسبة الإنجاز لكل من الهيئة التعليمية ولجنة التميز والهيئة الإدارية.
          </p>
          <ul className="mt-4 space-y-4">
            {kpis.departments.map((department) => (
              <li key={department.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="font-semibold">{department.label}</p>
                  <p className="text-slate-300">
                    {department.percent}% · {department.done}/{department.total}
                  </p>
                </div>
                <ProgressBar
                  value={department.percent}
                  tone={
                    department.percent >= 70
                      ? "done"
                      : department.percent >= 35
                        ? "accent"
                        : "brand"
                  }
                />
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
