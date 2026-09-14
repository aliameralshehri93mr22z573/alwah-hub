import { cookies } from "next/headers";
import {
  ACTIVE_WORKSPACE_COOKIE,
  ACTIVE_WORKSPACE_MAX_AGE,
  isWorkspaceId,
} from "@/lib/active-workspace";

export function activeWorkspaceCookieOptions() {
  return {
    path: "/",
    maxAge: ACTIVE_WORKSPACE_MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: false,
  };
}

export async function readActiveWorkspaceId() {
  try {
    const value = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim();
    return isWorkspaceId(value) ? value : null;
  } catch {
    return null;
  }
}

export async function writeActiveWorkspaceId(workspaceId: string) {
  if (!isWorkspaceId(workspaceId)) {
    return;
  }
  try {
    (await cookies()).set(
      ACTIVE_WORKSPACE_COOKIE,
      workspaceId,
      activeWorkspaceCookieOptions(),
    );
  } catch {
    // Called from a Server Component; middleware or the client will persist it.
  }
}
