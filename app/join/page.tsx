'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { JoinClient } from "@/app/join/join-client";

function JoinView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <AuthShell
      title="الانضمام إلى مساحة العمل"
      subtitle="نفعّل دخولك تلقائياً من رابط الدعوة، ثم ننقلك إلى لوحة المهام."
    >
      {token ? (
        <JoinClient token={token} />
      ) : (
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          رابط الدعوة غير مكتمل. اطلب رابطاً جديداً من مدير المساحة.
        </p>
      )}
    </AuthShell>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="الانضمام إلى مساحة العمل"
          subtitle="نفعّل دخولك تلقائياً من رابط الدعوة، ثم ننقلك إلى لوحة المهام."
        >
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            أهلاً بك! جاري تجهيز مساحة العمل...
          </p>
        </AuthShell>
      }
    >
      <JoinView />
    </Suspense>
  );
}
