import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { logAuthRouteError, logMissingSupabaseEnv } from "@/lib/auth-page";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  try {
    logMissingSupabaseEnv("register");
    const { next } = await searchParams;

    return (
      <AuthShell
        title="إنشاء حساب"
        subtitle="ننشئ لك مساحة عمل تلقائياً، ثم تختار قالب لوحتك الأولى."
      >
        <AuthForm mode="register" nextPath={next} />
      </AuthShell>
    );
  } catch (error) {
    logAuthRouteError("register", error);
    return (
      <AuthShell
        title="إنشاء حساب"
        subtitle="ننشئ لك مساحة عمل تلقائياً، ثم تختار قالب لوحتك الأولى."
      >
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          تعذر فتح صفحة التسجيل الآن. حدّث الصفحة أو حاول لاحقاً.
        </p>
      </AuthShell>
    );
  }
}
