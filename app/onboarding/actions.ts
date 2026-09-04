"use server";

import { redirect } from "next/navigation";
import { completeOnboarding, ensureWorkspace } from "@/lib/onboarding";
import { isTemplateType, type TemplateType } from "@/lib/templates";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export async function applyBoardTemplate(templateType: string) {
  if (!isTemplateType(templateType)) {
    return { error: "القالب المحدد غير معروف." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "لم يُضبط اتصال Supabase بعد." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await ensureWorkspace(supabase, user, templateType);
    await completeOnboarding(supabase, user, templateType as TemplateType);
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "تعذر تجهيز اللوحة.";
    return { error: message };
  }

  redirect("/dashboard");
}
