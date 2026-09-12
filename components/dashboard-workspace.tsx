"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Pencil, Plus, UserPlus, X } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import {
  createWorkspaceBoard,
  inviteWorkspaceMember,
  renameWorkspaceBoard,
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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<"board" | "invite" | "rename" | null>(
    null,
  );
  const [renameBoard, setRenameBoard] = useState<DashboardBoardCard | null>(
    null,
  );
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
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

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function onInvite(formData: FormData) {
    setInviteError(null);
    setInviteLink(null);
    setCopied(false);
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
    if (result.inviteToken) {
      setInviteLink(
        `${window.location.origin}/join?token=${result.inviteToken}`,
      );
    }
    router.refresh();
  }

  function openRename(board: DashboardBoardCard) {
    setRenameBoard(board);
    setRenameDraft(board.title);
    setRenameError(null);
  }

  async function saveRename() {
    if (!renameBoard) {
      return;
    }
    setPending("rename");
    setRenameError(null);
    const result = await renameWorkspaceBoard(renameBoard.id, renameDraft);
    setPending(null);
    if (!result.ok) {
      setRenameError(result.message);
      return;
    }
    setRenameBoard(null);
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{board.title}</p>
                    <button
                      type="button"
                      onClick={() => openRename(board)}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                      aria-label={`تعديل اسم ${board.title}`}
                      title="تعديل اسم اللوحة"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
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
        <h2 className="text-xl font-bold">دعوة الأعضاء</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          أدخل بريد المعلم وسنُنشئ رابط انضمام مباشر دون حاجة لحساب أو كلمة مرور.
          {definition.limits.maxMembers === null
            ? " باقة مساحة العمل بلا حد عملي على عدد الأعضاء."
            : ` باقة مساحة العمل (${definition.name}) حتى ${definition.limits.maxMembers} أعضاء.`}{" "}
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
        {inviteLink ? (
          <div className="mt-4 rounded-2xl border border-accent/30 bg-black/20 p-4">
            <p className="text-sm font-semibold text-accent">رابط الانضمام جاهز</p>
            <p className="mt-2 break-all text-sm text-slate-200" dir="ltr">
              {inviteLink}
            </p>
            <button
              type="button"
              onClick={() => void copyInviteLink()}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "تم النسخ" : "نسخ رابط الانضمام"}
            </button>
          </div>
        ) : null}
        {inviteError ? (
          <p className="mt-2 text-sm text-red-300">{inviteError}</p>
        ) : null}
      </section>

      <UpgradeModal reason={modal} onClose={() => setModal(null)} />

      {renameBoard ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 z-0 bg-black/60"
            onClick={() => setRenameBoard(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-board-title"
            className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1224] p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setRenameBoard(null)}
              className="absolute start-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="إغلاق النافذة"
            >
              <X className="size-4" />
            </button>
            <h2 id="rename-board-title" className="text-xl font-extrabold">
              تعديل اسم اللوحة
            </h2>
            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block text-slate-300">الاسم الجديد</span>
              <input
                value={renameDraft}
                onChange={(event) => setRenameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void saveRename();
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-brand focus:ring-2"
                autoFocus
              />
            </label>
            {renameError ? (
              <p className="mt-2 text-sm text-red-300">{renameError}</p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveRename()}
                disabled={pending === "rename"}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending === "rename" ? "جارٍ الحفظ…" : "حفظ"}
              </button>
              <button
                type="button"
                onClick={() => setRenameBoard(null)}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
