"use server";

import { randomBytes } from "node:crypto";
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
  | { ok: true; boardId?: string; inviteToken?: string }
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
  const roleRaw = String(formData.get("role") ?? "member");
  const role =
    roleRaw === "admin" || roleRaw === "owner" ? roleRaw : "member";
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
  if (user.email?.toLowerCase() === email) {
    return { ok: false, reason: "generic", message: "أنت عضو في المساحة بالفعل." };
  }

  try {
    await assertCanAddMember(supabase, workspaceId);
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return { ok: false, reason: "members", message: error.message };
    }
    throw error;
  }

  const writer = createAdminClient() ?? supabase;
  const { data: existing } = await writer
    .from("workspace_invites")
    .select("token, is_used")
    .eq("workspace_id", workspaceId)
    .ilike("email", email)
    .eq("is_used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) {
    return { ok: true, inviteToken: existing.token as string };
  }

  const token = randomBytes(32).toString("hex");
  const baseInvite = {
    workspace_id: workspaceId,
    email,
    role,
    token,
    is_used: false,
  };
  let inserted = await writer
    .from("workspace_invites")
    .insert({ ...baseInvite, invited_by: user.id })
    .select("token")
    .single();

  if (inserted.error) {
    inserted = await writer
      .from("workspace_invites")
      .insert(baseInvite)
      .select("token")
      .single();
  }

  if (inserted.error) {
    return { ok: false, reason: "generic", message: inserted.error.message };
  }

  return {
    ok: true,
    inviteToken: (inserted.data?.token as string | undefined) ?? token,
  };
}
