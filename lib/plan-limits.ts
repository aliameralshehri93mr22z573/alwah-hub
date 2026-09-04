import type { SupabaseClient } from "@supabase/supabase-js";
import { effectivePlan } from "@/lib/demo-session";
import { planOf, type PlanTier } from "@/lib/plans";

export type PlanLimitReason = "boards" | "members" | "tasks" | "generic";

export class PlanLimitError extends Error {
  readonly code = "PLAN_LIMIT";
  readonly href = "/pricing";
  readonly reason: PlanLimitReason;

  constructor(message: string, reason: PlanLimitReason = "generic") {
    super(message);
    this.name = "PlanLimitError";
    this.reason = reason;
  }
}

export function isPlanLimitError(error: unknown): error is PlanLimitError {
  return (
    error instanceof PlanLimitError ||
    (error instanceof Error && error.name === "PlanLimitError")
  );
}

type WorkspaceUsage = {
  workspaceId: string;
  plan: PlanTier;
  boards: number;
  members: number;
  activeTasks: number;
};

async function ownerPlan(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<PlanTier> {
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", ownerId)
    .maybeSingle();
  const plan = data?.plan;
  return effectivePlan(
    plan === "solo" || plan === "team" || plan === "agency" ? plan : "free",
  );
}

export async function workspaceUsage(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceUsage | null> {
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) {
    return null;
  }

  const [{ count: boards }, { count: members }, { data: boardsRows }, plan] =
    await Promise.all([
      supabase
        .from("boards")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase.from("boards").select("id").eq("workspace_id", workspaceId),
      ownerPlan(supabase, workspace.owner_id as string),
    ]);

  const boardIds = (boardsRows ?? []).map((row) => row.id as string);
  const activeTasks = await countActiveTasks(supabase, boardIds);

  return {
    workspaceId,
    plan,
    boards: boards ?? 0,
    members: members ?? 0,
    activeTasks,
  };
}

async function countActiveTasks(
  supabase: SupabaseClient,
  boardIds: string[],
): Promise<number> {
  if (boardIds.length === 0) {
    return 0;
  }

  const { data: columns } = await supabase
    .from("columns")
    .select("id, board_id, position")
    .in("board_id", boardIds);

  const byBoard = new Map<string, { id: string; position: number }[]>();
  for (const column of columns ?? []) {
    const list = byBoard.get(column.board_id) ?? [];
    list.push({ id: column.id, position: column.position });
    byBoard.set(column.board_id, list);
  }

  const doneIds = new Set<string>();
  for (const list of byBoard.values()) {
    if (list.length < 2) {
      continue;
    }
    const last = list.reduce((current, column) =>
      column.position >= current.position ? column : current,
    );
    doneIds.add(last.id);
  }

  const activeColumnIds = (columns ?? [])
    .filter((column) => !doneIds.has(column.id))
    .map((column) => column.id);

  if (activeColumnIds.length === 0) {
    return 0;
  }

  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .in("column_id", activeColumnIds);

  return count ?? 0;
}

function limitCopy(
  kind: "boards" | "members" | "tasks",
  max: number,
): string {
  if (kind === "boards") {
    return `الباقة الحالية تسمح بـ ${max} لوحات كحد أقصى. رقِّ الباقة لإضافة المزيد.`;
  }
  if (kind === "members") {
    return `الباقة الحالية تسمح بـ ${max} أعضاء كحد أقصى. رقِّ الباقة لدعوة الفريق.`;
  }
  return `الباقة المجانية تسمح بـ ${max} مهمة نشطة. انقل مهاماً إلى العمود الأخير أو رقِّ الباقة.`;
}

export async function assertCanCreateBoard(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  const usage = await workspaceUsage(supabase, workspaceId);
  if (!usage) {
    throw new PlanLimitError("لم يُعثر على مساحة العمل.");
  }
  const max = planOf(usage.plan).limits.maxBoards;
  if (max !== null && usage.boards >= max) {
    throw new PlanLimitError(limitCopy("boards", max), "boards");
  }
}

export async function assertCanAddMember(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  const usage = await workspaceUsage(supabase, workspaceId);
  if (!usage) {
    throw new PlanLimitError("لم يُعثر على مساحة العمل.");
  }
  const max = planOf(usage.plan).limits.maxMembers;
  if (max !== null && usage.members >= max) {
    throw new PlanLimitError(limitCopy("members", max), "members");
  }
}

export async function assertCanCreateTask(
  supabase: SupabaseClient,
  columnId: string,
) {
  const { data: column } = await supabase
    .from("columns")
    .select("board_id")
    .eq("id", columnId)
    .maybeSingle();

  if (!column) {
    throw new PlanLimitError("لم يُعثر على العمود.");
  }

  const { data: board } = await supabase
    .from("boards")
    .select("workspace_id")
    .eq("id", column.board_id)
    .maybeSingle();

  if (!board) {
    throw new PlanLimitError("لم يُعثر على اللوحة.");
  }

  const usage = await workspaceUsage(supabase, board.workspace_id as string);
  if (!usage) {
    throw new PlanLimitError("لم يُعثر على مساحة العمل.");
  }

  const max = planOf(usage.plan).limits.maxActiveTasks;
  if (max !== null && usage.activeTasks >= max) {
    throw new PlanLimitError(limitCopy("tasks", max), "tasks");
  }
}
