import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { TemplatePicker } from "@/app/onboarding/template-picker";
import { ensureWorkspace, hasCompletedOnboarding } from "@/lib/onboarding";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export default async function OnboardingPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    if (await hasCompletedOnboarding(supabase, user.id)) {
      redirect("/dashboard");
    }

    await ensureWorkspace(supabase, user);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-10">
      <BrandMark className="mb-8" />
      <p className="text-sm font-medium text-accent">التهيئة المسبقة</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
        اختر قالب لوحتك الأولى
      </h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        أنشأنا مساحة عملك تلقائياً. اختر قالباً فورياً أو طبّق القالب الافتراضي
        (العمل والمبيعات) للانتقال إلى لوحة التحكم.
      </p>
      <div className="mt-8">
        <TemplatePicker />
      </div>
    </main>
  );
}
