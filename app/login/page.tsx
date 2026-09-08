import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { logAuthRouteError, logMissingSupabaseEnv } from "@/lib/auth-page";
import { toArabicAuthError } from "@/lib/auth-errors";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  try {
    logMissingSupabaseEnv("login");
    const { error, next } = await searchParams;

    return (
      <AuthShell
        title="تسجيل الدخول"
        subtitle="ادخل إلى مساحاتك وألواح فريقك بالبريد وكلمة المرور أو برابط سريع."
      >
        {error ? (
          <p className="mb-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {toArabicAuthError(error)}
          </p>
        ) : null}
        <AuthForm mode="login" nextPath={next} />
      </AuthShell>
    );
  } catch (error) {
    logAuthRouteError("login", error);
    return (
      <AuthShell
        title="تسجيل الدخول"
        subtitle="ادخل إلى مساحاتك وألواح فريقك بالبريد وكلمة المرور أو برابط سريع."
      >
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          تعذر فتح صفحة الدخول الآن. حدّث الصفحة أو حاول لاحقاً.
        </p>
      </AuthShell>
    );
  }
}
