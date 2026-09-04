import Link from "next/link";
import { redirect } from "next/navigation";
import { planOf } from "@/lib/plans";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export default async function ReportsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 pb-28 md:pb-10">
        <h1 className="text-3xl font-extrabold">التقارير</h1>
        <p className="mt-3 leading-7 text-slate-300">
          التقارير متاحة لباقتي الفرق والمنشآت بعد ربط Supabase.
        </p>
        <Link href="/pricing" className="mt-6 inline-flex text-accent">
          عرض الباقات
        </Link>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/dashboard/reports");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = planOf(
    profile?.plan === "team" || profile?.plan === "agency"
      ? profile.plan
      : "free",
  );

  if (!plan.limits.reports) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 pb-28 md:pb-10">
        <h1 className="text-3xl font-extrabold">التقارير</h1>
        <p className="mt-3 leading-7 text-slate-300">
          التقارير ضمن باقة الفرق والمنشآت. باقتك الحالية: {plan.name}.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold"
        >
          ترقية الباقة
        </Link>
      </main>
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { count: boards } = workspace
    ? await supabase
        .from("boards")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
    : { count: 0 };
  const { count: members } = workspace
    ? await supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
    : { count: 0 };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 pb-28 md:pb-10">
      <h1 className="text-3xl font-extrabold">تقارير المساحة</h1>
      <p className="mt-2 text-slate-300">{workspace?.name ?? "مساحة العمل"}</p>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">اللوحات</p>
          <p className="mt-2 text-3xl font-extrabold">{boards ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">الأعضاء</p>
          <p className="mt-2 text-3xl font-extrabold">{members ?? 0}</p>
        </article>
      </section>
    </main>
  );
}
