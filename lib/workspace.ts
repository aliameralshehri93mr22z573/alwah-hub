import type { SupabaseClient } from "@supabase/supabase-js";
import { readActiveWorkspaceId } from "@/lib/active-workspace-server";
import { isWorkspaceId } from "@/lib/active-workspace";
import {
  grantedWorkspacePlan,
  planRank,
  storedPlanTier,
  type PlanTier,
} from "@/lib/plans";

export type WorkspaceRole = "owner" | "admin" | "member";

export type CurrentWorkspace = {
  id: string;
  name: string;
  ownerId: string;
  role: WorkspaceRole;
  plan: PlanTier;
};

function asRole(value: unknown): WorkspaceRole {
  return value === "admin" || value === "owner" ? value : "member";
}

function pickPreferred<T extends { id: string }>(
  items: T[],
  preferredId?: string | null,
) {
  if (!isWorkspaceId(preferredId)) {
    return null;
  }
  return items.find((item) => item.id === preferredId) ?? null;
}

function scoreWorkspace(
  item: { ownerId: string; plan: PlanTier },
  userId: string,
) {
  const sharedBonus = item.ownerId !== userId ? 100 : 0;
  return sharedBonus + planRank(item.plan);
}

export async function resolveCurrentWorkspace(
  supabase: SupabaseClient,
  userId: string,
  preferredWorkspaceId?: string | null,
): Promise<CurrentWorkspace | null> {
  const cookieWorkspaceId = await readActiveWorkspaceId();
  const [{ data: memberships }, owned] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId),
    supabase
      .from("workspaces")
      .select("id, name, owner_id, created_at, plan, plan_expires_at")
      .order("created_at", { ascending: true }),
  ]);

  type WorkspaceRow = {
    id: string;
    name: string;
    owner_id: string;
    created_at?: string;
    plan?: unknown;
    plan_expires_at?: string | null;
  };

  let workspaces = (owned.data ?? null) as WorkspaceRow[] | null;
  if (owned.error) {
    const fallback = await supabase
      .from("workspaces")
      .select("id, name, owner_id, created_at")
      .order("created_at", { ascending: true });
    workspaces = (fallback.data ?? null) as WorkspaceRow[] | null;
  }

  const roleByWorkspace = new Map(
    (memberships ?? []).map((row) => [
      row.workspace_id as string,
      asRole(row.role),
    ]),
  );

  const ownerIds = [
    ...new Set((workspaces ?? []).map((row) => row.owner_id as string)),
  ];
  const { data: owners } =
    ownerIds.length > 0
      ? await supabase.from("profiles").select("id, plan").in("id", ownerIds)
      : { data: [] as { id: string; plan: string | null }[] };
  const ownerPlanById = new Map(
    (owners ?? []).map((row) => [row.id as string, storedPlanTier(row.plan)]),
  );

  const accessible = (workspaces ?? []).map((row) => {
    const ownerId = row.owner_id as string;
    const promoPlan = grantedWorkspacePlan(
      "plan" in row ? row.plan : null,
      "plan_expires_at" in row ? (row.plan_expires_at as string | null) : null,
    );
    return {
      id: row.id as string,
      name: row.name as string,
      ownerId,
      role:
        ownerId === userId
          ? ("owner" as const)
          : roleByWorkspace.get(row.id as string) ?? "member",
      plan: promoPlan ?? ownerPlanById.get(ownerId) ?? "free",
    };
  });

  const ranked = [...accessible].sort((left, right) => {
    const scoreDiff =
      scoreWorkspace(right, userId) - scoreWorkspace(left, userId);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return left.name.localeCompare(right.name, "ar");
  });
  const best = ranked[0] ?? null;

  const fromQuery = pickPreferred(accessible, preferredWorkspaceId);
  if (fromQuery) {
    return fromQuery;
  }

  const fromCookie = pickPreferred(accessible, cookieWorkspaceId);
  if (
    fromCookie &&
    (!best || scoreWorkspace(fromCookie, userId) >= scoreWorkspace(best, userId))
  ) {
    return fromCookie;
  }

  return best;
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

export function canManageWorkspaceBoards(workspace: CurrentWorkspace | null) {
  return workspace?.role === "owner" || workspace?.role === "admin";
}

export function isWorkspaceMemberOnly(workspace: CurrentWorkspace | null) {
  return workspace?.role === "member";
}
