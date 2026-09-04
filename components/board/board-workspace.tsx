"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, LayoutGrid, Table2 } from "lucide-react";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TableView } from "@/components/board/table-view";
import { TaskDrawer } from "@/components/board/task-drawer";
import type { CalendarMode } from "@/components/board/task-card";
import { useBoardRealtime } from "@/hooks/use-board-realtime";
import { findTask, orderedIdsByColumn, upsertTask } from "@/lib/board-move";
import { buildCustomFields, BOARD_TEMPLATES } from "@/lib/templates";
import {
  persistNewTask,
  persistTaskMove,
  persistTaskUpdate,
  fetchBoardSnapshot,
} from "@/app/dashboard/boards/[id]/actions";
import type { BoardData, BoardTask } from "@/lib/board-types";

type BoardWorkspaceProps = {
  initialBoard: BoardData;
  live: boolean;
};

export function BoardWorkspace({ initialBoard, live }: BoardWorkspaceProps) {
  const [board, setBoard] = useState(initialBoard);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [calendar, setCalendar] = useState<CalendarMode>("both");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!live) {
      return;
    }
    const snapshot = await fetchBoardSnapshot(board.id);
    if (snapshot) {
      setBoard(snapshot as BoardData);
    }
  }, [board.id, live]);

  useBoardRealtime(board.id, () => {
    void reload();
  });

  const selected = selectedId ? findTask(board, selectedId)?.task ?? null : null;

  function handleBoardChange(next: BoardData, persist: boolean) {
    setBoard(next);
    if (!persist || !live) {
      return;
    }
    void persistTaskMove({
      taskId: "",
      fromColumnId: board.columns[0]?.id ?? "",
      toColumnId: next.columns[0]?.id ?? "",
      orderedIdsByColumn: orderedIdsByColumn(next),
    });
  }

  async function handleSave(task: BoardTask) {
    setBoard((current) => upsertTask(current, task));
    setSelectedId(null);
    if (live) {
      await persistTaskUpdate({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        custom_fields: task.custom_fields,
      });
    }
  }

  async function handleAddTask(columnId: string) {
    const template =
      board.template_type === "custom"
        ? null
        : BOARD_TEMPLATES[board.template_type];
    const custom_fields = template
      ? buildCustomFields(template)
      : { values: {}, fields: [], attachments: [] };

    setLimitMessage(null);

    if (live) {
      try {
        const saved = await persistNewTask({
          columnId,
          title: "مهمة جديدة",
          custom_fields,
        });
        setBoard((current) => upsertTask(current, saved));
        setSelectedId(saved.id);
      } catch (error) {
        setLimitMessage(
          error instanceof Error ? error.message : "تعذّر إنشاء المهمة.",
        );
      }
      return;
    }

    const localTask: BoardTask = {
      id: crypto.randomUUID(),
      column_id: columnId,
      title: "مهمة جديدة",
      description: "",
      priority: "medium",
      due_date: null,
      position:
        board.columns.find((column) => column.id === columnId)?.tasks.length ?? 0,
      custom_fields,
      created_at: new Date().toISOString(),
    };

    setBoard((current) => upsertTask(current, localTask));
    setSelectedId(localTask.id);
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-6 pb-8 sm:px-6 md:pb-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <ArrowRight className="size-4" aria-hidden />
            لوحة التحكم
          </Link>
          <h1 className="text-3xl font-extrabold">{board.title}</h1>
          {!live ? (
            <p className="mt-1 text-sm text-amber-200">
              عرض تجريبي — اربط Supabase لتفعيل المزامنة المباشرة بين أعضاء المساحة.
            </p>
          ) : (
            <p className="mt-1 text-sm text-accent">المزامنة المباشرة مفعّلة لهذه اللوحة.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                view === "kanban" ? "bg-brand text-white" : "text-slate-300"
              }`}
            >
              <LayoutGrid className="size-4" />
              كانبان
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                view === "table" ? "bg-brand text-white" : "text-slate-300"
              }`}
            >
              <Table2 className="size-4" />
              جدول
            </button>
          </div>
          <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
            <CalendarDays className="size-4 text-accent" />
            <select
              value={calendar}
              onChange={(event) => setCalendar(event.target.value as CalendarMode)}
              className="bg-transparent outline-none"
            >
              <option value="both">هجري وميلادي</option>
              <option value="hijri">هجري</option>
              <option value="gregorian">ميلادي</option>
            </select>
          </label>
        </div>
      </header>

      {limitMessage ? (
        <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm">
          {limitMessage}{" "}
          <Link href="/pricing" className="font-semibold text-accent">
            ترقية الباقة
          </Link>
        </p>
      ) : null}

      {view === "kanban" ? (
        <KanbanBoard
          board={board}
          calendar={calendar}
          onBoardChange={handleBoardChange}
          onOpenTask={setSelectedId}
          onAddTask={handleAddTask}
        />
      ) : (
        <TableView
          board={board}
          calendar={calendar}
          onOpenTask={setSelectedId}
        />
      )}

      <TaskDrawer
        task={selected}
        templateType={board.template_type}
        calendar={calendar}
        onClose={() => setSelectedId(null)}
        onSave={(task) => {
          void handleSave(task);
        }}
      />
    </div>
  );
}
