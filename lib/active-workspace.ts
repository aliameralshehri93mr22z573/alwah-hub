export const ACTIVE_WORKSPACE_COOKIE = "alwahhub_workspace";
export const ACTIVE_WORKSPACE_STORAGE_KEY = "current_workspace_id";

export const ACTIVE_WORKSPACE_MAX_AGE = 60 * 60 * 24 * 30;

export function isWorkspaceId(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.trim(),
      ),
  );
}

export function persistActiveWorkspaceClient(workspaceId: string) {
  if (!isWorkspaceId(workspaceId) || typeof document === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
  } catch {
    // Safari private mode may block localStorage.
  }
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=${workspaceId}; Path=/; Max-Age=${ACTIVE_WORKSPACE_MAX_AGE}; SameSite=Lax`;
}
