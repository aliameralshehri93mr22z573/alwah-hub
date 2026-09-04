"use client";

import { TaskDateLabel, type CalendarMode } from "@/components/board/task-card";
import { PriorityBadge } from "@/components/board/priority-badge";
import { fieldSchemaForTask, fieldValue, taskAttachments } from "@/lib/custom-fields";
import type { BoardData } from "@/lib/board-types";

type TableViewProps = {
  board: BoardData;
  calendar: CalendarMode;
  onOpenTask: (taskId: string) => void;
};

export function TableView({ board, calendar, onOpenTask }: TableViewProps) {
  const schema = board.columns
    .flatMap((column) =>
      column.tasks.flatMap((task) => fieldSchemaForTask(task, board.template_type)),
    )
    .filter(
      (field, index, list) => list.findIndex((item) => item.key === field.key) === index,
    );

  const rows = board.columns.flatMap((column) =>
    column.tasks.map((task) => ({ column, task })),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">المهمة</th>
            <th className="px-4 py-3 font-medium">العمود</th>
            <th className="px-4 py-3 font-medium">الأولوية</th>
            <th className="px-4 py-3 font-medium">الاستحقاق</th>
            {schema.map((field) => (
              <th key={field.key} className="px-4 py-3 font-medium">
                {field.label}
              </th>
            ))}
            <th className="px-4 py-3 font-medium">مرفقات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ column, task }) => (
            <tr
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenTask(task.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onOpenTask(task.id);
                }
              }}
              className="cursor-pointer border-t border-white/10 hover:bg-white/5"
            >
              <td className="px-4 py-3 font-semibold">{task.title}</td>
              <td className="px-4 py-3 text-slate-300">{column.title}</td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                <TaskDateLabel iso={task.due_date} calendar={calendar} />
              </td>
              {schema.map((field) => (
                <td key={field.key} className="px-4 py-3 text-slate-300">
                  {String(fieldValue(task, field.key) ?? "—")}
                </td>
              ))}
              <td className="px-4 py-3 text-slate-300">
                {taskAttachments(task).length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
