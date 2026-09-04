import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="إنشاء حساب"
      subtitle="ننشئ لك مساحة عمل تلقائياً، ثم تختار قالب لوحتك الأولى."
    >
      <AuthForm mode="register" nextPath={next} />
    </AuthShell>
  );
}
