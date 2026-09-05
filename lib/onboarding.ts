import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  BOARD_TEMPLATES,
  DEFAULT_TEMPLATE,
  buildCustomFields,
  type TemplateType,
} from "@/lib/templates";

type ProvisionResult = {
  workspaceId: string;
  boardId: string | null;
};

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const existing = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing.data?.id) {
    return;
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "";
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    email: user.email ?? null,
    plan: "free",
  });

  if (error && error.code !== "23505") {
    throw error;
  }
}

function workspaceNameFor(user: User, templateType: TemplateType) {
  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "العمل";
  const template = BOARD_TEMPLATES[templateType];
  return `${template.workspaceName} — ${fullName}`;
}

export async function ensureWorkspace(
  supabase: SupabaseClient,
  user: User,
  templateType: TemplateType = DEFAULT_TEMPLATE,
) {
  await ensureProfile(supabase, user);

  const existing = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name: workspaceNameFor(user, templateType),
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function getFirstBoardId(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  const { data, error } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.id as string | undefined) ?? null;
}

export async function hasCompletedOnboarding(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace?.id) {
    return false;
  }

  const boardId = await getFirstBoardId(supabase, workspace.id);
  return Boolean(boardId);
}

async function provisionViaClient(
  supabase: SupabaseClient,
  user: User,
  templateType: TemplateType,
): Promise<ProvisionResult> {
  const template = BOARD_TEMPLATES[templateType];
  const workspaceId = await ensureWorkspace(supabase, user, templateType);
  const existingBoardId = await getFirstBoardId(supabase, workspaceId);

  if (existingBoardId) {
    return { workspaceId, boardId: existingBoardId };
  }

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspaceId,
      title: template.title,
      template_type: template.type,
    })
    .select("id")
    .single();

  if (boardError) {
    throw boardError;
  }

  const { data: columns, error: columnsError } = await supabase
    .from("columns")
    .insert(
      template.columns.map((title, position) => ({
        board_id: board.id,
        title,
        position,
      })),
    )
    .select("id, position")
    .order("position", { ascending: true });

  if (columnsError) {
    throw columnsError;
  }

  const firstColumnId = columns[0]?.id;
  if (firstColumnId) {
    const { error: taskError } = await supabase.from("tasks").insert({
      column_id: firstColumnId,
      title: template.sampleTask.title,
      description: template.sampleTask.description,
      priority: "medium",
      position: 0,
      custom_fields: buildCustomFields(template),
    });

    if (taskError) {
      throw taskError;
    }
  }

  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  return { workspaceId, boardId: board.id as string };
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  user: User,
  templateType: TemplateType,
): Promise<ProvisionResult> {
  const rpc = await supabase.rpc("complete_onboarding", {
    p_template: templateType,
  });

  if (!rpc.error && rpc.data) {
    const payload = rpc.data as {
      workspace_id?: string;
      board_id?: string;
    };
    if (payload.workspace_id) {
      return {
        workspaceId: payload.workspace_id,
        boardId: payload.board_id ?? null,
      };
    }
  }

  const rpcMissing =
    rpc.error &&
    (rpc.error.code === "PGRST202" ||
      rpc.error.code === "42883" ||
      rpc.error.message.includes("complete_onboarding"));

  if (rpc.error && !rpcMissing) {
    throw rpc.error;
  }

  return provisionViaClient(supabase, user, templateType);
}
