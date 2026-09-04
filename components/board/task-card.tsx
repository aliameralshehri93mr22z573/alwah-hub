"use client";

import { Paperclip } from "lucide-react";
import { useEffect, useState } from "react";
import { PriorityBadge } from "@/components/board/priority-badge";
import { fieldSchemaForTask, fieldValue, taskAttachments } from "@/lib/custom-fields";
import { formatBothCalendars } from "@/lib/dates";
import type { BoardTask } from "@/lib/board-types";
import type { TemplateType } from "@/lib/templates";

export type CalendarMode = "both" | "gregorian" | "hijri";

export function TaskDateLabel({
  iso,
  calendar,
}: {
  iso: string | null;
  calendar: CalendarMode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!iso) {
    return null;
  }

  if (!ready) {
    return <span className="text-xs text-slate-300">{iso}</span>;
  }

  const { gregorian, hijri } = formatBothCalendars(iso);
  if (calendar === "gregorian") {
    return <span className="text-xs text-slate-300">{gregorian}</span>;
  }
  if (calendar === "hijri") {
    return <span className="text-xs text-slate-300">{hijri}</span>;
  }
  return (
    <span className="block text-xs text-slate-300">
      {gregorian}
      <span className="mt-0.5 block text-accent">{hijri}</span>
    </span>
  );
}

export function TaskCardContent({
  task,
  templateType,
  calendar,
}: {
  task: BoardTask;
  templateType: TemplateType | "custom";
  calendar: CalendarMode;
}) {
  const attachments = taskAttachments(task);
  const previewField = fieldSchemaForTask(task, templateType)[0];
  const previewValue = previewField ? fieldValue(task, previewField.key) : null;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-6">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      {previewField && previewValue !== null && previewValue !== "" ? (
        <p className="mt-2 text-xs text-slate-300">
          {previewField.label}: {String(previewValue)}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <TaskDateLabel iso={task.due_date} calendar={calendar} />
        {attachments.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Paperclip className="size-3" aria-hidden />
            {attachments.length}
          </span>
        ) : null}
      </div>
    </>
  );
}
