import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <section className="relative flex flex-col justify-center px-6 py-12 sm:px-10">
        <Link href="/" className="mb-10 inline-flex w-fit">
          <BrandMark />
        </Link>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-md text-slate-300">{subtitle}</p>
        <div className="mt-8 max-w-md">{children}</div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#0B1224] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute -start-10 top-10 h-64 w-64 rounded-full bg-brand/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -end-8 bottom-8 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        />
        <p className="relative text-sm font-medium text-accent">AlwahHub</p>
        <div className="relative space-y-4">
          <h2 className="max-w-sm text-3xl font-extrabold leading-snug">
            مساحتك الأولى تُنشأ تلقائياً، والقالب تختاره في ثوانٍ.
          </h2>
          <p className="max-w-sm text-slate-300">
            سجّل بالبريد وكلمة المرور أو برابط سريع، ثم ابدأ بلوحة مبيعات،
            برمجة، تعليم، أو مناسبات.
          </p>
        </div>
        <ul className="relative grid gap-2 text-sm text-slate-200">
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            مبيعات: عميل محتمل → مغلقة بنجاح
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            برمجة: قائمة المهام → مكتمل
          </li>
        </ul>
      </aside>
    </div>
  );
}
