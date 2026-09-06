import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkspaceRole = "owner" | "admin" | "member";

export type CurrentWorkspace = {
  id: string;
  name: string;
  ownerId: string;
  role: WorkspaceRole;
};

function asRole(value: unknown): WorkspaceRole {
  return value === "admin" || value === "owner" ? value : "member";
}

export async function resolveCurrentWorkspace(
  supabase: SupabaseClient,
  userId: string,
): Promise<CurrentWorkspace | null> {
  const [{ data: memberships }, { data: workspaces }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId),
    supabase
      .from("workspaces")
      .select("id, name, owner_id, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const roleByWorkspace = new Map(
    (memberships ?? []).map((row) => [
      row.workspace_id as string,
      asRole(row.role),
    ]),
  );

  const accessible = (workspaces ?? []).map((row) => {
    const ownerId = row.owner_id as string;
    return {
      id: row.id as string,
      name: row.name as string,
      ownerId,
      role: ownerId === userId ? ("owner" as const) : roleByWorkspace.get(row.id as string) ?? "member",
    };
  });

  return (
    accessible.find((item) => item.ownerId !== userId) ??
    accessible.find((item) => item.ownerId === userId) ??
    null
  );
}

export function isWorkspaceOwner(
  workspace: CurrentWorkspace | null,
  userId: string,
) {
  return Boolean(workspace && workspace.ownerId === userId);
}

export function canInviteWorkspaceMembers(workspace: CurrentWorkspace | null) {
  return workspace?.role === "owner" || workspace?.role === "admin";
}
