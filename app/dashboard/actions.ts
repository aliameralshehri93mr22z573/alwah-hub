"use server";

import {
  assertCanAddMember,
  assertCanCreateBoard,
  PlanLimitError,
} from "@/lib/plan-limits";
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

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

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

async function findUserIdByEmail(email: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (data?.id) {
      return data.id as string;
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const match = data.users.find(
    (item) => item.email?.toLowerCase() === email,
  );
  return match?.id ?? null;
}
