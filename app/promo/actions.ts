"use server";

import { resolveCurrentWorkspace } from "@/lib/workspace";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export type PromoCodeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const SUCCESS_MESSAGE = "تم تفعيل باقة المحترفين للمدرسة بنجاح لمدة سنة!";

type PromoRow = {
  id: string;
  code?: string;
  duration_days?: number | null;
  max_uses?: number | null;
  times_used?: number | null;
  active?: boolean | null;
};

function escapeIlikeExact(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function isActivePromo(promo: PromoRow) {
  if (promo.active === false) {
    return false;
  }
  const used = promo.times_used ?? 0;
  const max = promo.max_uses;
  return max == null || used < max;
}

async function loadPromo(
  client: NonNullable<ReturnType<typeof createAdminClient>> | Awaited<
    ReturnType<typeof createClient>
  >,
  code: string,
) {
  const match = escapeIlikeExact(code);
  const full = await client
    .from("promo_codes")
    .select("id, code, duration_days, max_uses, times_used, active")
    .ilike("code", match)
    .maybeSingle();

  if (!full.error && full.data) {
    return full.data as PromoRow;
  }

  const basic = await client
    .from("promo_codes")
    .select("id, code, max_uses, times_used")
    .ilike("code", match)
    .maybeSingle();

  if (basic.error || !basic.data) {
    return null;
  }

  return basic.data as PromoRow;
}

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
  if (!workspace) {
    return { ok: false, message: "أكمل تهيئة مساحة العمل أولاً." };
  }
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return {
      ok: false,
      message: "تطبيق كود الخصم متاح لمدير مساحة العمل فقط.",
    };
  }

  const writer = createAdminClient() ?? supabase;
  const promo = await loadPromo(writer, trimmed);
  if (!promo?.id) {
    return { ok: false, message: "كود الخصم غير صحيح أو منتهٍ." };
  }
  if (!isActivePromo(promo)) {
    return { ok: false, message: "تم استهلاك هذا الكود بالكامل." };
  }

  const days = Number(promo.duration_days) > 0 ? Number(promo.duration_days) : 365;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const used = promo.times_used ?? 0;

  const { error: workspaceError } = await writer
    .from("workspaces")
    .update({
      plan: "pro",
      plan_expires_at: expiresAt,
    })
    .eq("id", workspace.id);

  if (workspaceError) {
    return { ok: false, message: workspaceError.message };
  }

  const { error: counterError } = await writer
    .from("promo_codes")
    .update({ times_used: used + 1 })
    .eq("id", promo.id);

  if (counterError) {
    return { ok: false, message: counterError.message };
  }

  return { ok: true, message: SUCCESS_MESSAGE };
}
