"use server";

import {
  assertCanAddMember,
  assertCanCreateBoard,
  PlanLimitError,
} from "@/lib/plan-limits";
import { resolveCurrentWorkspace } from "@/lib/workspace";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import {
  DEMO_BOARDS_COOKIE,
  demoCookieOptions,
  newDemoBoard,
  readDemoBoards,
  readDemoPlan,
} from "@/lib/demo-session";
import { cookies } from "next/headers";

export type PlanActionResult =
  | { ok: true; boardId?: string }
  | {
      ok: false;
      reason: "boards" | "members" | "generic";
      message: string;
    };

export async function createWorkspaceBoard(): Promise<PlanActionResult> {
  if (!isSupabaseConfigured()) {
    const plan = await readDemoPlan();
    if (!plan) {
      return {
        ok: false,
        reason: "boards",
        message: "الباقة المجانية تسمح بلوحتين فقط.",
      };
    }
    const boards = await readDemoBoards();
    const created = newDemoBoard(boards.length + 1);
    const jar = await cookies();
    jar.set(
      DEMO_BOARDS_COOKIE,
      JSON.stringify([...boards, created]),
      demoCookieOptions(),
    );
    return { ok: true, boardId: created.id };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "generic", message: "يلزم تسجيل الدخول." };
  }

  const workspace = await resolveCurrentWorkspace(supabase, user.id);

  if (!workspace) {
    return { ok: false, reason: "generic", message: "أكمل التهيئة أولاً." };
  }

  try {
    await assertCanCreateBoard(supabase, workspace.id);
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return { ok: false, reason: "boards", message: error.message };
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspace.id,
      title: "لوحة جديدة",
      template_type: "custom",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, reason: "generic", message: error.message };
  }

  await supabase.from("columns").insert([
    { board_id: data.id, title: "للتنفيذ", position: 0 },
    { board_id: data.id, title: "جارٍ", position: 1 },
    { board_id: data.id, title: "تم", position: 2 },
  ]);

  return { ok: true, boardId: data.id as string };
}

export async function inviteWorkspaceMember(
  formData: FormData,
): Promise<PlanActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason: "members",
      message: "الباقة المجانية تسمح بثلاثة أعضاء فقط.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  if (!email || !workspaceId) {
    return { ok: false, reason: "generic", message: "أدخل بريداً صالحاً." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "generic", message: "يلزم تسجيل الدخول." };
  }

  try {
    await assertCanAddMember(supabase, workspaceId);
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return { ok: false, reason: "members", message: error.message };
    }
    throw error;
  }

  const memberId = await findUserIdByEmail(email);
  if (!memberId) {
    return {
      ok: false,
      reason: "generic",
      message: "لا يوجد حساب بهذا البريد. اطلب من الزميل التسجيل أولاً.",
    };
  }
  if (memberId === user.id) {
    return { ok: false, reason: "generic", message: "أنت عضو في المساحة بالفعل." };
  }

  const { error } = await supabase.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: memberId,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, reason: "generic", message: "هذا العضو موجود مسبقاً." };
    }
    return { ok: false, reason: "generic", message: error.message };
  }

  return { ok: true };
}

function escapeIlikeExact(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function syncProfileEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  email: string,
) {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (data?.id) {
    await admin.from("profiles").update({ email }).eq("id", userId);
    return;
  }

  await admin.from("profiles").insert({
    id: userId,
    email,
    plan: "free",
  });
}

async function findAuthUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    try {
      const response = await fetch(
        `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
          },
          cache: "no-store",
        },
      );
      if (response.ok) {
        const payload = (await response.json()) as {
          users?: { id: string; email?: string | null }[];
        };
        const match = payload.users?.find(
          (item) => item.email?.toLowerCase() === email,
        );
        if (match?.id) {
          return { id: match.id, email: match.email ?? email };
        }
      }
    } catch {
      // Fall through to a bounded listUsers scan.
    }
  }

  const { data } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
  const match = data.users.find((item) => item.email?.toLowerCase() === email);
  return match?.id
    ? { id: match.id, email: match.email ?? email }
    : null;
}

async function findUserIdByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const admin = createAdminClient();
  if (admin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", escapeIlikeExact(normalized))
      .maybeSingle();
    if (profile?.id) {
      return profile.id as string;
    }

    const byAuth = await findAuthUserIdByEmail(admin, normalized);
    if (byAuth?.id) {
      await syncProfileEmail(admin, byAuth.id, byAuth.email);
      return byAuth.id;
    }
  }

  const supabase = await createClient();
  const rpc = await supabase.rpc("lookup_profile_id_by_email", {
    p_email: normalized,
  });
  if (!rpc.error && typeof rpc.data === "string" && rpc.data) {
    return rpc.data;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", escapeIlikeExact(normalized))
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
