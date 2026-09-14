import type { SupabaseClient } from "@supabase/supabase-js";

export const SCHOOL_DEPARTMENTS = [
  {
    label: "الهيئة التعليمية",
    needles: ["الهيئة التعليمية", "هيئة تعليمية", "تعليم"],
  },
  {
    label: "لجنة التميز",
    needles: ["لجنة التميز", "التميز", "تميز"],
  },
  {
    label: "الهيئة الإدارية",
    needles: ["الهيئة الإدارية", "الهيئة الادارية", "إدارية", "ادارية"],
  },
] as const;

export type DepartmentKpi = {
  label: string;
  boardId: string | null;
  total: number;
  done: number;
  percent: number;
};

export type WorkspaceKpis = {
  total: number;
  done: number;
  inProgress: number;
  percent: number;
  departments: DepartmentKpi[];
};

export function emptyWorkspaceKpis(): WorkspaceKpis {
  return {
    total: 0,
    done: 0,
    inProgress: 0,
    percent: 0,
    departments: SCHOOL_DEPARTMENTS.map((item) => ({
      label: item.label,
      boardId: null,
      total: 0,
      done: 0,
      percent: 0,
    })),
  };
}

export function completionPercent(done: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((done / total) * 100);
}

type ColumnKind = "done" | "progress" | "other";

function classifyColumn(
  title: string,
  position: number,
  maxPosition: number,
): ColumnKind {
  const normalized = title.trim();
  if (/تم\b|منجز|مكتمل|\bdone\b|\bcomplete/i.test(normalized)) {
    return "done";
  }
  if (/جار|قيد التنفيذ|in progress|\bdoing\b/i.test(normalized)) {
    return "progress";
  }
  if (maxPosition > 0 && position === maxPosition) {
    return "done";
  }
  return "other";
}

function matchesDepartment(boardTitle: string, needles: readonly string[]) {
  const title = boardTitle.trim();
  return needles.some(
    (needle) => title === needle || title.includes(needle),
  );
}

export function buildWorkspaceKpis(
  boards: Array<{ id: string; title: string }>,
  columns: Array<{
    id: string;
    board_id: string;
    title: string;
    position: number;
  }>,
  tasks: Array<{ id: string; column_id: string }>,
): WorkspaceKpis {
  const columnsByBoard = new Map<string, typeof columns>();
  for (const column of columns) {
    const list = columnsByBoard.get(column.board_id) ?? [];
    list.push(column);
    columnsByBoard.set(column.board_id, list);
  }

  const kindByColumn = new Map<string, ColumnKind>();
  for (const list of columnsByBoard.values()) {
    const maxPosition = list.reduce(
      (max, column) => Math.max(max, column.position),
      0,
    );
    for (const column of list) {
      kindByColumn.set(
        column.id,
        classifyColumn(column.title, column.position, maxPosition),
      );
    }
  }

  const countByColumn = new Map<string, number>();
  for (const task of tasks) {
    countByColumn.set(
      task.column_id,
      (countByColumn.get(task.column_id) ?? 0) + 1,
    );
  }

  let total = 0;
  let done = 0;
  let inProgress = 0;
  const boardStats = new Map<string, { total: number; done: number }>();

  for (const board of boards) {
    const boardColumns = columnsByBoard.get(board.id) ?? [];
    let boardTotal = 0;
    let boardDone = 0;
    for (const column of boardColumns) {
      const count = countByColumn.get(column.id) ?? 0;
      boardTotal += count;
      const kind = kindByColumn.get(column.id) ?? "other";
      if (kind === "done") {
        boardDone += count;
        done += count;
      } else if (kind === "progress") {
        inProgress += count;
      }
    }
    total += boardTotal;
    boardStats.set(board.id, { total: boardTotal, done: boardDone });
  }

  const departments = SCHOOL_DEPARTMENTS.map((department) => {
    const matched = boards.filter((board) =>
      matchesDepartment(board.title, department.needles),
    );
    const stats = matched.reduce(
      (sum, board) => {
        const current = boardStats.get(board.id) ?? { total: 0, done: 0 };
        return {
          total: sum.total + current.total,
          done: sum.done + current.done,
        };
      },
      { total: 0, done: 0 },
    );
    return {
      label: department.label,
      boardId: matched[0]?.id ?? null,
      total: stats.total,
      done: stats.done,
      percent: completionPercent(stats.done, stats.total),
    };
  });

  return {
    total,
    done,
    inProgress,
    percent: completionPercent(done, total),
    departments,
  };
}

export async function workspaceKpis(
  supabase: SupabaseClient,
  workspaceId: string,
  options?: { assignedTo?: string | null },
): Promise<WorkspaceKpis> {
  const { data: boards, error: boardsError } = await supabase
    .from("boards")
    .select("id, title")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (boardsError) {
    throw boardsError;
  }

  const boardRows = (boards ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
  }));
  const boardIds = boardRows.map((row) => row.id);
  if (boardIds.length === 0) {
    return emptyWorkspaceKpis();
  }

  const { data: columns, error: columnsError } = await supabase
    .from("columns")
    .select("id, board_id, title, position")
    .in("board_id", boardIds);

  if (columnsError) {
    throw columnsError;
  }

  const columnRows = (columns ?? []).map((row) => ({
    id: row.id as string,
    board_id: row.board_id as string,
    title: row.title as string,
    position: Number(row.position) || 0,
  }));
  const columnIds = columnRows.map((row) => row.id);
  if (columnIds.length === 0) {
    return buildWorkspaceKpis(boardRows, [], []);
  }

  let tasksQuery = supabase
    .from("tasks")
    .select("id, column_id, assigned_to")
    .in("column_id", columnIds);
  if (options?.assignedTo) {
    tasksQuery = tasksQuery.eq("assigned_to", options.assignedTo);
  }

  const { data: tasks, error: tasksError } = await tasksQuery;

  if (tasksError) {
    throw tasksError;
  }

  return buildWorkspaceKpis(
    boardRows,
    columnRows,
    (tasks ?? []).map((row) => ({
      id: row.id as string,
      column_id: row.column_id as string,
    })),
  );
}
