"use server";

import { resolveCurrentWorkspace } from "@/lib/workspace";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export type PromoCodeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function applyPromoCode(code: string): Promise<PromoCodeResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "اربط Supabase لتفعيل أكواد الخصم.",
    };
  }

  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, message: "أدخل كود الخصم." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يلزم تسجيل الدخول لتطبيق الكود." };
  }

  const workspace = await resolveCurrentWorkspace(supabase, user.id);
  if (workspace && workspace.ownerId !== user.id) {
    return {
      ok: false,
      message: "تطبيق كود الخصم متاح لمالك مساحة العمل فقط.",
    };
  }

  const rpc = await supabase.rpc("apply_promo_code", { p_code: trimmed });
  if (rpc.error) {
    return {
      ok: false,
      message: rpc.error.message.includes("apply_promo_code")
        ? "تعذّر تطبيق الكود. تأكد من إنشاء جدول promo_codes في قاعدة البيانات."
        : rpc.error.message,
    };
  }

  const payload = rpc.data as { ok?: boolean; message?: string } | null;
  if (payload && typeof payload === "object") {
    if (payload.ok) {
      return {
        ok: true,
        message:
          payload.message ||
          "تم تفعيل اشتراك باقة المحترفين لمدة سنة بنجاح!",
      };
    }
    return {
      ok: false,
      message: payload.message || "كود الخصم غير صحيح أو منتهٍ.",
    };
  }

  return { ok: false, message: "تعذّر تطبيق كود الخصم." };
}
