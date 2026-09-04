"use server";

import { asCustomFields } from "@/lib/custom-fields";
import { isTemplateType } from "@/lib/templates";
import { assertCanCreateTask } from "@/lib/plan-limits";
import {
  reindexColumnTasks,
  sortTasks,
  isTaskPriority,
  type BoardTask,
  type CustomFields,
  type TaskPriority,
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

export async function persistTaskUpdate(input: {
  id: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  custom_fields?: CustomFields;
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
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BoardTask;
}

export async function fetchBoardSnapshot(boardId: string) {
  const supabase = await requireClient();
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, title, template_type")
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
  const { data: tasks, error: tasksError } = columnIds.length
    ? await supabase.from("tasks").select("*").in("column_id", columnIds)
    : { data: [], error: null };

  if (tasksError) {
    throw tasksError;
  }

  const grouped = new Map<string, BoardTask[]>();
  for (const raw of tasks ?? []) {
    const task = raw as BoardTask;
    const normalized: BoardTask = {
      ...task,
      priority: isTaskPriority(String(task.priority)) ? task.priority : "medium",
      custom_fields: asCustomFields(task.custom_fields),
    };
    const list = grouped.get(normalized.column_id) ?? [];
    list.push(normalized);
    grouped.set(normalized.column_id, list);
  }

  return {
    id: board.id as string,
    title: board.title as string,
    template_type: isTemplateType(String(board.template_type))
      ? board.template_type
      : "custom",
    columns: (columns ?? []).map((column) => ({
      ...column,
      tasks: reindexColumnTasks(
        sortTasks(grouped.get(column.id) ?? []),
        column.id,
      ),
    })),
  };
}
