"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, Plus } from "lucide-react";
import { SortableTaskCard } from "@/components/board/sortable-task-card";
import { TaskCardContent, type CalendarMode } from "@/components/board/task-card";
import type { BoardColumn } from "@/lib/board-types";
import type { TemplateType } from "@/lib/templates";

export function columnDroppableId(columnId: string) {
  return `column:${columnId}`;
}

export function parseColumnDroppableId(id: string) {
  return id.startsWith("column:") ? id.slice("column:".length) : null;
}

type KanbanColumnProps = {
  column: BoardColumn;
  templateType: TemplateType | "custom";
  calendar: CalendarMode;
  onOpenTask: (taskId: string) => void;
  onAddTask: (columnId: string) => void;
};

export function StaticKanbanColumn({
  column,
  templateType,
  calendar,
  onOpenTask,
  onAddTask,
}: KanbanColumnProps) {
  return (
    <section className="flex w-[min(85vw,20rem)] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
      <ColumnHeader title={column.title} count={column.tasks.length} />
      <div className="flex min-h-24 flex-1 flex-col gap-3">
        {column.tasks.map((task) => (
          <article
            key={task.id}
            className="flex gap-2 rounded-xl border border-white/10 bg-primary p-3 text-sm shadow-sm"
          >
            <span className="mt-0.5 text-slate-500" aria-hidden>
              <GripVertical className="size-4" />
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 text-start"
              onClick={() => onOpenTask(task.id)}
            >
              <TaskCardContent
                task={task}
                templateType={templateType}
                calendar={calendar}
              />
            </button>
          </article>
        ))}
      </div>
      <AddTaskButton onClick={() => onAddTask(column.id)} />
    </section>
  );
}

export function KanbanColumn({
  column,
  templateType,
  calendar,
  onOpenTask,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(column.id),
    data: { type: "column", columnId: column.id },
  });

  return (
    <section
      className={`flex w-[min(85vw,20rem)] shrink-0 snap-start flex-col rounded-2xl border p-3 ${
        isOver ? "border-brand bg-brand/10" : "border-white/10 bg-white/5"
      }`}
    >
      <ColumnHeader title={column.title} count={column.tasks.length} />
      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-3">
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              templateType={templateType}
              calendar={calendar}
              onOpen={onOpenTask}
            />
          ))}
        </div>
      </SortableContext>
      <AddTaskButton onClick={() => onAddTask(column.id)} />
    </section>
  );
}

function ColumnHeader({ title, count }: { title: string; count: number }) {
  return (
    <header className="mb-3 flex items-center justify-between gap-2 px-1">
      <h2 className="font-bold">{title}</h2>
      <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs text-slate-300">
        {count}
      </span>
    </header>
  );
}

function AddTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      <Plus className="size-4" aria-hidden />
      مهمة جديدة
    </button>
  );
}
