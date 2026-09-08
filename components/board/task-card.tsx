"use client";

import { Paperclip } from "lucide-react";
import { useEffect, useState } from "react";
import { PriorityBadge } from "@/components/board/priority-badge";
import { fieldSchemaForTask, fieldValue, taskAttachments } from "@/lib/custom-fields";
import { formatBothCalendars } from "@/lib/dates";
import {
  findMember,
  memberInitial,
  memberLabel,
  type BoardTask,
  type WorkspaceMember,
} from "@/lib/board-types";
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

export function AssigneeAvatar({
  member,
}: {
  member: WorkspaceMember | null;
}) {
  if (!member) {
    return null;
  }

  return (
    <span
      title={memberLabel(member)}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent"
    >
      {memberInitial(member)}
    </span>
  );
}

export function TaskCardContent({
  task,
  templateType,
  calendar,
  members = [],
}: {
  task: BoardTask;
  templateType: TemplateType | "custom";
  calendar: CalendarMode;
  members?: WorkspaceMember[];
}) {
  const attachments = taskAttachments(task);
  const previewField = fieldSchemaForTask(task, templateType)[0];
  const previewValue = previewField ? fieldValue(task, previewField.key) : null;
  const assignee = findMember(members, task.assigned_to);

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
      <div className="mt-3 flex items-end justify-between gap-2">
        <TaskDateLabel iso={task.due_date} calendar={calendar} />
        <div className="flex items-center gap-2">
          {attachments.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Paperclip className="size-3" aria-hidden />
              {attachments.length}
            </span>
          ) : null}
          <AssigneeAvatar member={assignee} />
        </div>
      </div>
    </>
  );
}
