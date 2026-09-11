'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

function RegisterView() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  return (
    <AuthShell
      title="إنشاء حساب"
      subtitle="ننشئ لك مساحة عمل تلقائياً، ثم تختار قالب لوحتك الأولى."
    >
      <AuthForm mode="register" nextPath={next} />
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="إنشاء حساب"
          subtitle="ننشئ لك مساحة عمل تلقائياً، ثم تختار قالب لوحتك الأولى."
        >
          <p className="text-sm text-slate-300">جارٍ تحميل صفحة التسجيل…</p>
        </AuthShell>
      }
    >
      <RegisterView />
    </Suspense>
  );
}
