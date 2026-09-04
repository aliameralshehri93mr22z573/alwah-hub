"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn, StaticKanbanColumn, parseColumnDroppableId } from "@/components/board/kanban-column";
import { TaskCardContent, type CalendarMode } from "@/components/board/task-card";
import {
  findTask,
  moveTaskInBoard,
  sameTaskOrder,
} from "@/lib/board-move";
import type { BoardData } from "@/lib/board-types";

type KanbanBoardProps = {
  board: BoardData;
  calendar: CalendarMode;
  onBoardChange: (board: BoardData, persist: boolean) => void;
  onOpenTask: (taskId: string) => void;
  onAddTask: (columnId: string) => void;
};

export function KanbanBoard({
  board,
  calendar,
  onBoardChange,
  onOpenTask,
  onAddTask,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTask = activeId ? findTask(board, activeId)?.task : null;

  const columnByTaskId = useMemo(() => {
    const map = new Map<string, string>();
    for (const column of board.columns) {
      for (const task of column.tasks) {
        map.set(task.id, column.id);
      }
    }
    return map;
  }, [board]);

  function containerOf(id: string) {
    return parseColumnDroppableId(id) ?? columnByTaskId.get(id) ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const fromColumnId = containerOf(String(active.id));
    const toColumnId = containerOf(String(over.id));
    if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) {
      return;
    }

    const overColumn = board.columns.find((column) => column.id === toColumnId);
    if (!overColumn) {
      return;
    }

    const overIndex = parseColumnDroppableId(String(over.id))
      ? overColumn.tasks.length
      : Math.max(
          0,
          overColumn.tasks.findIndex((task) => task.id === String(over.id)),
        );

    const next = moveTaskInBoard(board, String(active.id), toColumnId, overIndex);
    if (!sameTaskOrder(board, next)) {
      onBoardChange(next, false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      onBoardChange(board, true);
      return;
    }

    const fromColumnId = containerOf(String(active.id));
    const toColumnId = containerOf(String(over.id));
    if (!fromColumnId || !toColumnId) {
      return;
    }

    const toColumn = board.columns.find((column) => column.id === toColumnId);
    if (!toColumn) {
      return;
    }

    const overIndex = parseColumnDroppableId(String(over.id))
      ? toColumn.tasks.length - (fromColumnId === toColumnId ? 1 : 0)
      : toColumn.tasks.findIndex((task) => task.id === String(over.id));

    const next = moveTaskInBoard(
      board,
      String(active.id),
      toColumnId,
      Math.max(0, overIndex),
    );
    onBoardChange(next, true);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[28rem] snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 pb-4 [-webkit-overflow-scrolling:touch]">
        {board.columns.map((column) => (
          <StaticKanbanColumn
            key={column.id}
            column={column}
            templateType={board.template_type}
            calendar={calendar}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-[28rem] snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 pb-4 [-webkit-overflow-scrolling:touch]">
        {board.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            templateType={board.template_type}
            calendar={calendar}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[min(85vw,20rem)] rounded-xl border border-brand bg-primary p-3 text-sm shadow-2xl">
            <TaskCardContent
              task={activeTask}
              templateType={board.template_type}
              calendar={calendar}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
