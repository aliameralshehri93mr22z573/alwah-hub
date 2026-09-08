"use server";

import { connection } from "next/server";
import { asCustomFields } from "@/lib/custom-fields";
import { isTemplateType, type TemplateType } from "@/lib/templates";
import { assertCanCreateTask } from "@/lib/plan-limits";
import {
  memberLabel,
  reindexColumnTasks,
  sortTasks,
  isTaskPriority,
  type BoardData,
  type BoardTask,
  type CustomFields,
  type TaskPriority,
  type WorkspaceMember,
} from "@/lib/board-types";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

async function requireClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("لم يُضبط اتصال Supabase بعد.");
  }
  return createClient();
}

export async function persistTaskMove(input: {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  orderedIdsByColumn: Record<string, string[]>;
}) {
  const supabase = await requireClient();
  const columnIds = Array.from(
    new Set([input.fromColumnId, input.toColumnId, ...Object.keys(input.orderedIdsByColumn)]),
  );

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .in("column_id", columnIds);

  if (error) {
    throw error;
  }

  const byId = new Map((tasks as BoardTask[]).map((task) => [task.id, task]));
  const updates: Array<Pick<BoardTask, "id" | "column_id" | "position">> = [];

  for (const [columnId, orderedIds] of Object.entries(input.orderedIdsByColumn)) {
    orderedIds.forEach((taskId, position) => {
      const current = byId.get(taskId);
      if (!current) {
        return;
      }
      if (current.column_id !== columnId || current.position !== position) {
        updates.push({ id: taskId, column_id: columnId, position });
      }
    });
  }

  await Promise.all(
    updates.map((update) =>
      supabase
        .from("tasks")
        .update({ column_id: update.column_id, position: update.position })
        .eq("id", update.id),
    ),
  );
}

function normalizeTask(raw: BoardTask): BoardTask {
  return {
    ...raw,
    assigned_to: raw.assigned_to ? String(raw.assigned_to) : null,
    priority: isTaskPriority(String(raw.priority)) ? raw.priority : "medium",
    custom_fields: asCustomFields(raw.custom_fields),
  };
}

async function fetchWorkspaceMembers(
  supabase: Awaited<ReturnType<typeof requireClient>>,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const { data: rows } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId);

  const ids = [...new Set((rows ?? []).map((row) => row.user_id as string))];
  if (ids.length === 0) {
    return [];
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);

  return (profiles ?? [])
    .map((profile) => ({
      id: profile.id as string,
      full_name: (profile.full_name as string | null) ?? null,
      email: (profile.email as string | null) ?? null,
    }))
    .sort((left, right) =>
      memberLabel(left).localeCompare(memberLabel(right), "ar"),
    );
}

export type BoardSnapshot = BoardData & {
  members: WorkspaceMember[];
  currentUserId: string | null;
};

export async function persistTaskUpdate(input: {
  id: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  custom_fields?: CustomFields;
  assigned_to?: string | null;
}) {
  const supabase = await requireClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.due_date !== undefined ? { due_date: input.due_date } : {}),
      ...(input.custom_fields !== undefined ? { custom_fields: input.custom_fields } : {}),
      ...(input.assigned_to !== undefined ? { assigned_to: input.assigned_to } : {}),
    })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

export async function persistNewTask(input: {
  columnId: string;
  title: string;
  custom_fields: CustomFields;
  assigned_to?: string | null;
}) {
  const supabase = await requireClient();
  await assertCanCreateTask(supabase, input.columnId);
  const { data: existing, error: listError } = await supabase
    .from("tasks")
    .select("id, position")
    .eq("column_id", input.columnId)
    .order("position", { ascending: false })
    .limit(1);

  if (listError) {
    throw listError;
  }

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      column_id: input.columnId,
      title: input.title,
      description: "",
      priority: "medium",
      position: nextPosition,
      custom_fields: input.custom_fields,
      assigned_to: input.assigned_to ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeTask(data as BoardTask);
}

export async function fetchBoardSnapshot(boardId: string): Promise<BoardSnapshot | null> {
  await connection();
  const supabase = await requireClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, title, template_type, workspace_id")
    .eq("id", boardId)
    .maybeSingle();

  if (boardError) {
    throw boardError;
  }
  if (!board) {
    return null;
  }

  const { data: columns, error: columnsError } = await supabase
    .from("columns")
    .select("id, board_id, title, position, created_at")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (columnsError) {
    throw columnsError;
  }

  const columnIds = (columns ?? []).map((column) => column.id);
  const [{ data: tasks, error: tasksError }, members] = await Promise.all([
    columnIds.length
      ? supabase.from("tasks").select("*").in("column_id", columnIds)
      : Promise.resolve({ data: [] as BoardTask[], error: null }),
    fetchWorkspaceMembers(supabase, board.workspace_id as string),
  ]);

  if (tasksError) {
    throw tasksError;
  }

  const grouped = new Map<string, BoardTask[]>();
  for (const raw of tasks ?? []) {
    const normalized = normalizeTask(raw as BoardTask);
    const list = grouped.get(normalized.column_id) ?? [];
    list.push(normalized);
    grouped.set(normalized.column_id, list);
  }

  return {
    id: board.id as string,
    title: board.title as string,
    template_type: isTemplateType(String(board.template_type))
      ? (board.template_type as TemplateType)
      : "custom",
    columns: (columns ?? []).map((column) => ({
      ...column,
      tasks: reindexColumnTasks(
        sortTasks(grouped.get(column.id) ?? []),
        column.id,
      ),
    })),
    members,
    currentUserId: user?.id ?? null,
  };
}
