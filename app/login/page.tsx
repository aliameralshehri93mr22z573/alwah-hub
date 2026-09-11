'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { toArabicAuthError } from "@/lib/auth-errors";

function LoginView() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next") ?? undefined;

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="تسجيل الدخول"
          subtitle="ادخل إلى مساحاتك وألواح فريقك بالبريد وكلمة المرور أو برابط سريع."
        >
          <p className="text-sm text-slate-300">جارٍ تحميل صفحة الدخول…</p>
        </AuthShell>
      }
    >
      <LoginView />
    </Suspense>
  );
}
