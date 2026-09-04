import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { toArabicAuthError } from "@/lib/auth-errors";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
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
}
