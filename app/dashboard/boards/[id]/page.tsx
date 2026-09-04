import { BoardWorkspace } from "@/components/board/board-workspace";
import { createDemoBoard } from "@/lib/demo-board";
import { fetchBoardSnapshot } from "@/app/dashboard/boards/[id]/actions";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type BoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardBoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return <BoardWorkspace initialBoard={createDemoBoard()} live={false} />;
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

  return <BoardWorkspace initialBoard={board} live />;
}
