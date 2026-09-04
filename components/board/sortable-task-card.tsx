"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { TaskCardContent, type CalendarMode } from "@/components/board/task-card";
import type { BoardTask } from "@/lib/board-types";
import type { TemplateType } from "@/lib/templates";

type SortableTaskCardProps = {
  task: BoardTask;
  templateType: TemplateType | "custom";
  calendar: CalendarMode;
  onOpen: (taskId: string) => void;
};

export function SortableTaskCard({
  task,
  templateType,
  calendar,
  onOpen,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex gap-2 rounded-xl border border-white/10 bg-primary p-3 text-sm shadow-sm ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <button
        type="button"
        className="mt-0.5 cursor-grab touch-none text-slate-500 hover:text-white active:cursor-grabbing"
        aria-label="سحب المهمة"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 text-start"
        onClick={() => onOpen(task.id)}
      >
        <TaskCardContent
          task={task}
          templateType={templateType}
          calendar={calendar}
        />
      </button>
    </article>
  );
}
