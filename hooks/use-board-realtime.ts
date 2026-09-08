"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { asCustomFields } from "@/lib/custom-fields";
import {
  isTaskPriority,
  sortColumns,
  sortTasks,
  type BoardColumn,
  type BoardData,
  type BoardTask,
} from "@/lib/board-types";

export type BoardRealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

function row(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asTask(record: Record<string, unknown>): BoardTask {
  return {
    id: String(record.id),
    column_id: String(record.column_id),
    title: String(record.title ?? ""),
    description: (record.description as string | null) ?? null,
    priority: isTaskPriority(String(record.priority ?? ""))
      ? (record.priority as BoardTask["priority"])
      : "medium",
    due_date: (record.due_date as string | null) ?? null,
    position: Number(record.position ?? 0),
    custom_fields: asCustomFields(record.custom_fields),
    assigned_to: record.assigned_to ? String(record.assigned_to) : null,
    created_at: String(record.created_at ?? new Date().toISOString()),
  };
}

function asColumn(
  record: Record<string, unknown>,
  tasks: BoardTask[] = [],
): BoardColumn {
  return {
    id: String(record.id),
    board_id: String(record.board_id),
    title: String(record.title ?? ""),
    position: Number(record.position ?? 0),
    created_at: String(record.created_at ?? new Date().toISOString()),
    tasks,
  };
}

export function applyRealtimeChange(
  board: BoardData,
  payload: BoardRealtimePayload,
): BoardData {
  const event = payload.eventType;
  const next = row(payload.new);
  const prev = row(payload.old);

  if (payload.table === "columns") {
    const boardId = String(next.board_id ?? prev.board_id ?? "");
    if (boardId && boardId !== board.id) {
      return board;
    }

    if (event === "DELETE") {
      const id = String(prev.id ?? "");
      return {
        ...board,
        columns: board.columns.filter((column) => column.id !== id),
      };
    }

    const incoming = asColumn(
      next,
      board.columns.find((column) => column.id === next.id)?.tasks ?? [],
    );
    const columns = board.columns.some((column) => column.id === incoming.id)
      ? board.columns.map((column) =>
          column.id === incoming.id
            ? { ...incoming, tasks: column.tasks }
            : column,
        )
      : [...board.columns, incoming];
    return { ...board, columns: sortColumns(columns) };
  }

  if (payload.table === "tasks") {
    if (event === "DELETE") {
      const id = String(prev.id ?? "");
      return {
        ...board,
        columns: board.columns.map((column) => ({
          ...column,
          tasks: column.tasks.filter((task) => task.id !== id),
        })),
      };
    }

    const task = asTask(next);
    const knownColumns = new Set(board.columns.map((column) => column.id));
    if (!knownColumns.has(task.column_id)) {
      return board;
    }

    return {
      ...board,
      columns: board.columns.map((column) => {
        const without = column.tasks.filter((item) => item.id !== task.id);
        if (column.id !== task.column_id) {
          return { ...column, tasks: without };
        }
        const tasks = column.tasks.some((item) => item.id === task.id)
          ? column.tasks.map((item) => (item.id === task.id ? task : item))
          : [...without, task];
        return { ...column, tasks: sortTasks(tasks) };
      }),
    };
  }

  return board;
}

export function useBoardRealtime(
  boardId: string,
  onChange: (payload: BoardRealtimePayload) => void,
  enabled = true,
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const demoBoard = boardId === "demo" || boardId.startsWith("demo-");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!enabled || demoBoard) {
      return;
    }

    if (!url || !anonKey) {
      console.warn(
        "Realtime skipped: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
      return;
    }

    const supabase = createBrowserClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const handlePayload = (payload: BoardRealtimePayload) => {
      console.log("Realtime payload:", payload);
      onChangeRef.current(payload);
    };

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`alwah-board-${boardId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "columns",
            filter: `board_id=eq.${boardId}`,
          },
          handlePayload as (payload: BoardRealtimePayload) => void,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
          },
          handlePayload as (payload: BoardRealtimePayload) => void,
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);
        });
    })();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
        return;
      }
      for (const existing of supabase.getChannels()) {
        if (existing.topic.includes(`alwah-board-${boardId}`)) {
          void supabase.removeChannel(existing);
        }
      }
    };
  }, [boardId, enabled]);
}
