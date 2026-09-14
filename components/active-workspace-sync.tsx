"use client";

import { useEffect } from "react";
import { persistActiveWorkspaceClient } from "@/lib/active-workspace";

export function ActiveWorkspaceSync({
  workspaceId,
}: {
  workspaceId: string | null;
}) {
  useEffect(() => {
    if (workspaceId) {
      persistActiveWorkspaceClient(workspaceId);
    }
  }, [workspaceId]);

  return null;
}
