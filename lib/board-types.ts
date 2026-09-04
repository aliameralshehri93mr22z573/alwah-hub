import type { TemplateField, TemplateType } from "@/lib/templates";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskAttachment = {
  id: string;
  name: string;
  url: string;
  added_at: string;
};

export type CustomFields = {
  template?: string;
  template_title?: string;
  fields?: TemplateField[];
  values?: Record<string, string | number | null>;
  attachments?: TaskAttachment[];
  [key: string]: unknown;
};

export type BoardTask = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  custom_fields: CustomFields;
  created_at: string;
};

export type BoardColumn = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  tasks: BoardTask[];
};

export type BoardData = {
  id: string;
  title: string;
  template_type: TemplateType | "custom";
  columns: BoardColumn[];
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

export function isTaskPriority(value: string): value is TaskPriority {
  return value in PRIORITY_LABELS;
}

export function sortTasks(tasks: BoardTask[]) {
  return [...tasks].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
}

export function sortColumns(columns: BoardColumn[]) {
  return [...columns]
    .sort((a, b) => a.position - b.position)
    .map((column) => ({ ...column, tasks: sortTasks(column.tasks) }));
}

export function reindexColumnTasks(tasks: BoardTask[], columnId: string): BoardTask[] {
  return tasks.map((task, index) => ({
    ...task,
    column_id: columnId,
    position: index,
  }));
}
