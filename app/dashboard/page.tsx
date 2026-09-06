import { redirect } from "next/navigation";
import { Kanban, LogOut } from "lucide-react";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { PlanBanner } from "@/components/plan-banner";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { workspaceUsage } from "@/lib/plan-limits";
import { type PlanTier } from "@/lib/plans";
import {
  effectivePlan,
  readDemoBoards,
} from "@/lib/demo-session";
import { isTemplateType, type TemplateType } from "@/lib/templates";
import {
  canInviteWorkspaceMembers,
  isWorkspaceOwner,
  resolveCurrentWorkspace,
} from "@/lib/workspace";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

type DashboardBoard = {
  id: string;
  title: string;
  template_type: TemplateType | "custom";
  columns: { title: string }[];
};

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    const plan = await effectivePlan(null);
    const boards = await readDemoBoards();
    return (
      <DashboardFrame
        email={null}
        workspaceId={null}
        workspaceName={undefined}
        boards={boards}
        plan={plan}
        usage={{
          boards: boards.length,
          members: 1,
          activeTasks: 0,
        }}
        live={false}
        canManagePlan
        canInvite
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

  if (!(await hasCompletedOnboarding(supabase, user.id))) {
    redirect("/onboarding");
  }

  const workspace = await resolveCurrentWorkspace(supabase, user.id);

  let boards: DashboardBoard[] = [];
  let plan: PlanTier = "free";
  let usage: { boards: number; members: number; activeTasks: number } | null =
    null;

  if (workspace?.id) {
    const [{ data: boardRows }, stats] = await Promise.all([
      supabase
        .from("boards")
        .select("id, title, template_type, columns(title, position)")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true }),
      workspaceUsage(supabase, workspace.id),
    ]);

    plan = stats?.plan ?? (await effectivePlan("free"));
    usage = stats
      ? {
          boards: stats.boards,
          members: stats.members,
          activeTasks: stats.activeTasks,
        }
      : null;

    boards = (boardRows ?? []).map((data) => {
      const columns = [
        ...((data.columns as { title: string; position: number }[]) ?? []),
      ]
        .sort((a, b) => a.position - b.position)
        .map((column) => ({ title: column.title }));
      return {
        id: data.id as string,
        title: data.title as string,
        template_type: isTemplateType(String(data.template_type))
          ? data.template_type
          : "custom",
        columns,
      };
    });
  }

  return (
    <DashboardFrame
      email={user.email ?? null}
      workspaceId={workspace?.id ?? null}
      workspaceName={workspace?.name}
      boards={boards}
      plan={plan}
      usage={usage}
      live
      canManagePlan={isWorkspaceOwner(workspace, user.id)}
      canInvite={canInviteWorkspaceMembers(workspace)}
    />
  );
}

function DashboardFrame({
  email,
  workspaceId,
  workspaceName,
  boards,
  plan,
  usage,
  live,
  canManagePlan,
  canInvite,
}: {
  email: string | null;
  workspaceId: string | null;
  workspaceName?: string;
  boards: DashboardBoard[];
  plan: PlanTier;
  usage: { boards: number; members: number; activeTasks: number } | null;
  live: boolean;
  canManagePlan: boolean;
  canInvite: boolean;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <PlanBanner plan={plan} canManagePlan={canManagePlan} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand">
              <Kanban className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
              <p className="text-sm text-slate-300">
                {workspaceName ?? email ?? "اربط Supabase لتفعيل الجلسات"}
              </p>
            </div>
          </div>
          {live ? (
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
              >
                <LogOut className="size-4" aria-hidden />
                خروج
              </button>
            </form>
          ) : null}
        </header>

        <DashboardWorkspace
          workspaceId={workspaceId}
          boards={boards}
          plan={plan}
          usage={usage}
          live={live}
          canInvite={canInvite}
        />
      </main>
    </div>
  );
}
