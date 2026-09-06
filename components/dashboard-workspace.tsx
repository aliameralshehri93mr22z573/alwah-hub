"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import {
  createWorkspaceBoard,
  inviteWorkspaceMember,
} from "@/app/dashboard/actions";
import {
  UpgradeModal,
  type UpgradeReason,
} from "@/components/upgrade-modal";
import { planOf, type PlanTier } from "@/lib/plans";
import type { TemplateType } from "@/lib/templates";
import { BOARD_TEMPLATES } from "@/lib/templates";

export type DashboardBoardCard = {
  id: string;
  title: string;
  template_type: TemplateType | "custom";
  columns: { title: string }[];
};

export function DashboardWorkspace({
  workspaceId,
  boards,
  plan,
  usage,
  live,
  canInvite = true,
}: {
  workspaceId: string | null;
  boards: DashboardBoardCard[];
  plan: PlanTier;
  usage: { boards: number; members: number; activeTasks: number } | null;
  live: boolean;
  canInvite?: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<UpgradeReason | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pending, setPending] = useState<"board" | "invite" | null>(null);
  const definition = planOf(plan);

  async function onCreateBoard() {
    const atBoardLimit =
      definition.limits.maxBoards !== null &&
      (usage?.boards ?? boards.length) >= definition.limits.maxBoards;
    if (atBoardLimit) {
      setModal("boards");
      return;
    }
    if (!live && plan === "free") {
      setModal("boards");
      return;
    }

    setPending("board");
    const result = await createWorkspaceBoard();
    setPending(null);
    if (!result.ok) {
      if (result.reason === "boards" || result.reason === "members") {
        setModal(result.reason);
        return;
      }
      return;
    }
    router.refresh();
    if (live && result.boardId) {
      router.push(`/dashboard/boards/${result.boardId}`);
    }
  }

  async function onInvite(formData: FormData) {
    setInviteError(null);
    const atMemberLimit =
      definition.limits.maxMembers !== null &&
      (usage?.members ?? 1) >= definition.limits.maxMembers;
    if (atMemberLimit || !live) {
      setModal("members");
      return;
    }

    setPending("invite");
    const result = await inviteWorkspaceMember(formData);
    setPending(null);
    if (!result.ok) {
      if (result.reason === "members") {
        setModal("members");
        return;
      }
      setInviteError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">الألواح</h2>
          <LanguageToggle />
        </div>
        {boards.length === 0 ? (
          <p className="mt-3 leading-7 text-slate-300">
            {live
              ? "لم تُنشأ لوحة بعد. أكمل التهيئة أو أنشئ لوحة جديدة."
              : "اربط Supabase لإدارة ألواحك، أو جرّب اللوحة التجريبية."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {boards.map((board) => {
              const templateLabel =
                board.template_type !== "custom"
                  ? BOARD_TEMPLATES[board.template_type]?.title
                  : null;
              return (
                <li
                  key={board.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="font-semibold">{board.title}</p>
                  {templateLabel ? (
                    <p className="mt-1 text-sm text-accent">{templateLabel}</p>
                  ) : null}
                  <ol className="mt-3 flex flex-wrap gap-2">
                    {board.columns.map((column) => (
                      <li
                        key={column.title}
                        className="rounded-full bg-black/30 px-3 py-1 text-xs text-slate-200 sm:text-sm"
                      >
                        {column.title}
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={`/dashboard/boards/${board.id}`}
                    className="mt-4 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
                  >
                    فتح اللوحة
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void onCreateBoard()}
            disabled={pending === "board"}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-60"
          >
            <Plus className="size-4" />
            {pending === "board" ? "جارٍ الإنشاء…" : "لوحة جديدة"}
          </button>
          {!live ? (
            <Link
              href="/dashboard/boards/demo"
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              تجربة إدارة المهام
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h2 className="text-xl font-bold">دعوة عضو</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {definition.limits.maxMembers === null
            ? "باقة مساحة العمل بلا حد عملي على عدد الأعضاء."
            : `باقة مساحة العمل (${definition.name}) حتى ${definition.limits.maxMembers} أعضاء.`}{" "}
          الأعضاء الحاليون: {usage?.members ?? 1}
          {definition.limits.maxMembers !== null
            ? ` من ${definition.limits.maxMembers}.`
            : "."}
        </p>
        {canInvite ? (
          <form action={onInvite} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="workspaceId" value={workspaceId ?? ""} />
            <input
              type="email"
              name="email"
              required={live}
              placeholder="بريد العضو"
              className="min-h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none ring-brand focus:ring-2"
            />
            {live ? (
              <button
                type="submit"
                disabled={pending === "invite"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <UserPlus className="size-4" />
                دعوة
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModal("members")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
              >
                <UserPlus className="size-4" />
                دعوة
              </button>
            )}
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            دعوة الأعضاء وترقية الباقة متاحتان لمالك المساحة فقط.
          </p>
        )}
        {inviteError ? (
          <p className="mt-2 text-sm text-red-300">{inviteError}</p>
        ) : null}
      </section>

      <UpgradeModal reason={modal} onClose={() => setModal(null)} />
    </>
  );
}
