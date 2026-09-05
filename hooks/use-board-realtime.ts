import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export function useBoardRealtime(
  boardId: string,
  onChange: () => void,
  enabled = true,
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const demoBoard = boardId === "demo" || boardId.startsWith("demo-");
    if (!enabled || demoBoard || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`alwah-board-${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns" },
        () => onChangeRef.current(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => onChangeRef.current(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [boardId, enabled]);
}
