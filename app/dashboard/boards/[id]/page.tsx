import { BoardWorkspace } from "@/components/board/board-workspace";
import {
  createDemoBoard,
  DEMO_CURRENT_USER_ID,
  DEMO_MEMBERS,
  isIsolatedDemoBoard,
} from "@/lib/demo-board";
import { fetchBoardSnapshot } from "@/app/dashboard/boards/[id]/actions";
import { isWorkspaceMemberOnly, resolveCurrentWorkspace } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type BoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardBoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  const demoBoard = id === "demo" || id.startsWith("demo-");

  if (!isSupabaseConfigured()) {
    return (
      <BoardWorkspace
        initialBoard={createDemoBoard()}
        members={DEMO_MEMBERS}
        currentUserId={DEMO_CURRENT_USER_ID}
        live={false}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (demoBoard) {
    const workspace = await resolveCurrentWorkspace(supabase, user.id);
    if (workspace) {
      const { data: schoolBoards } = await supabase
        .from("boards")
        .select("id, title, template_type")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true });
      const memberOnly = isWorkspaceMemberOnly(workspace);
      const firstBoard = (schoolBoards ?? []).find(
        (board) => !memberOnly || !isIsolatedDemoBoard(board),
      );
      if (firstBoard?.id) {
        redirect(`/dashboard/boards/${firstBoard.id}`);
      }
    }
    redirect("/dashboard");
  }

  const board = await fetchBoardSnapshot(id);
  if (!board) {
    redirect("/dashboard");
  }

  const workspace = await resolveCurrentWorkspace(supabase, user.id);
  if (
    workspace &&
    board.workspaceId !== workspace.id &&
    isWorkspaceMemberOnly(workspace)
  ) {
    redirect(`/dashboard?workspace=${workspace.id}`);
  }
  if (
    isWorkspaceMemberOnly(workspace) &&
    isIsolatedDemoBoard(board)
  ) {
    redirect(workspace ? `/dashboard?workspace=${workspace.id}` : "/dashboard");
  }

  const { members, currentUserId, workspaceId: _workspaceId, ...initialBoard } =
    board;

  return (
    <BoardWorkspace
      initialBoard={initialBoard}
      members={members}
      currentUserId={currentUserId}
      live
    />
  );
}
