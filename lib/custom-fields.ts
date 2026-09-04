import type { BoardTask, CustomFields, TaskAttachment } from "@/lib/board-types";
import { BOARD_TEMPLATES, type TemplateField, type TemplateType } from "@/lib/templates";

export function asCustomFields(value: unknown): CustomFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { fields: [], values: {}, attachments: [] };
  }
  const record = value as CustomFields;
  return {
    ...record,
    fields: Array.isArray(record.fields) ? record.fields : [],
    values:
      record.values && typeof record.values === "object" ? record.values : {},
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
  };
}

export function fieldSchemaForTask(
  task: BoardTask,
  templateType: TemplateType | "custom",
): TemplateField[] {
  const fromTask = asCustomFields(task.custom_fields).fields;
  if (fromTask && fromTask.length > 0) {
    return fromTask;
  }
  if (templateType !== "custom") {
    return BOARD_TEMPLATES[templateType].fields;
  }
  return [];
}

export function fieldValue(
  task: BoardTask,
  key: string,
): string | number | null {
  const custom = asCustomFields(task.custom_fields);
  if (custom.values && key in custom.values) {
    return custom.values[key] ?? null;
  }
  const direct = custom[key];
  if (typeof direct === "string" || typeof direct === "number") {
    return direct;
  }
  return null;
}

export function upsertFieldValue(
  task: BoardTask,
  key: string,
  value: string | number | null,
): CustomFields {
  const custom = asCustomFields(task.custom_fields);
  return {
    ...custom,
    values: {
      ...custom.values,
      [key]: value,
    },
  };
}

export function taskAttachments(task: BoardTask): TaskAttachment[] {
  return asCustomFields(task.custom_fields).attachments ?? [];
}

export function withAttachments(
  task: BoardTask,
  attachments: TaskAttachment[],
): CustomFields {
  return {
    ...asCustomFields(task.custom_fields),
    attachments,
  };
}
