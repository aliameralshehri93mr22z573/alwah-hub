import { BoardWorkspace } from "@/components/board/board-workspace";
import {
  createDemoBoard,
  DEMO_CURRENT_USER_ID,
  DEMO_MEMBERS,
} from "@/lib/demo-board";
import { fetchBoardSnapshot } from "@/app/dashboard/boards/[id]/actions";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type BoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardBoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  const demoBoard = id === "demo" || id.startsWith("demo-");

  if (!isSupabaseConfigured() || demoBoard) {
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

  const board = await fetchBoardSnapshot(id);
  if (!board) {
    redirect("/dashboard");
  }

  const { members, currentUserId, ...initialBoard } = board;

  return (
    <BoardWorkspace
      initialBoard={initialBoard}
      members={members}
      currentUserId={currentUserId}
      live
    />
  );
}
