"use client";

import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link2, Paperclip, X } from "lucide-react";
import { PriorityBadge } from "@/components/board/priority-badge";
import { TaskDateLabel, type CalendarMode } from "@/components/board/task-card";
import {
  PRIORITY_LABELS,
  type BoardTask,
  type TaskAttachment,
  type TaskPriority,
} from "@/lib/board-types";
import {
  fieldSchemaForTask,
  fieldValue,
  taskAttachments,
  upsertFieldValue,
  withAttachments,
} from "@/lib/custom-fields";
import type { TemplateType } from "@/lib/templates";

const PRIORITIES = Object.keys(PRIORITY_LABELS) as TaskPriority[];

type TaskDrawerProps = {
  task: BoardTask | null;
  templateType: TemplateType | "custom";
  calendar: CalendarMode;
  onClose: () => void;
  onSave: (task: BoardTask) => void;
};

export function TaskDrawer({
  task,
  templateType,
  calendar,
  onClose,
  onSave,
}: TaskDrawerProps) {
  const [draft, setDraft] = useState<BoardTask | null>(task);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sheetOffset, setSheetOffset] = useState(0);
  const dragStart = useRef<number | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    setDraft(task);
    setLinkName("");
    setLinkUrl("");
    setSheetOffset(0);
    offsetRef.current = 0;
  }, [task]);

  const fields = useMemo(
    () => (draft ? fieldSchemaForTask(draft, templateType) : []),
    [draft, templateType],
  );
  const attachments = draft ? taskAttachments(draft) : [];

  if (!draft) {
    return null;
  }

  function update(partial: Partial<BoardTask>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function addAttachment(event: FormEvent) {
    event.preventDefault();
    if (!linkName.trim() || !linkUrl.trim() || !draft) {
      return;
    }
    const next: TaskAttachment = {
      id: crypto.randomUUID(),
      name: linkName.trim(),
      url: linkUrl.trim(),
      added_at: new Date().toISOString(),
    };
    update({
      custom_fields: withAttachments(draft, [...attachments, next]),
    });
    setLinkName("");
    setLinkUrl("");
  }

  function removeAttachment(id: string) {
    if (!draft) {
      return;
    }
    update({
      custom_fields: withAttachments(
        draft,
        attachments.filter((item) => item.id !== id),
      ),
    });
  }

  function onSheetPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onSheetPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current == null) {
      return;
    }
    const next = Math.max(0, event.clientY - dragStart.current);
    offsetRef.current = next;
    setSheetOffset(next);
  }

  function onSheetPointerUp() {
    if (offsetRef.current > 110) {
      onClose();
    }
    offsetRef.current = 0;
    setSheetOffset(0);
    dragStart.current = null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row">
      <button
        type="button"
        aria-label="إغلاق"
        className="order-1 min-h-16 flex-1 bg-black/50 md:order-2 md:h-full"
        onClick={onClose}
      />
      <aside
        style={{ transform: sheetOffset ? `translateY(${sheetOffset}px)` : undefined }}
        className="order-2 mt-auto flex max-h-[92dvh] w-full max-w-none flex-col overflow-y-auto rounded-t-3xl border-white/10 bg-[#0B1224] p-6 shadow-2xl md:order-1 md:mt-0 md:h-full md:max-w-md md:rounded-none md:border-e"
      >
        <div
          className="mb-4 flex cursor-grab touch-none flex-col items-center py-1 md:hidden"
          onPointerDown={onSheetPointerDown}
          onPointerMove={onSheetPointerMove}
          onPointerUp={onSheetPointerUp}
          onPointerCancel={onSheetPointerUp}
        >
          <span className="h-1.5 w-12 rounded-full bg-white/30" />
          <span className="mt-2 text-xs text-slate-400">اسحب للأسفل للإغلاق</span>
        </div>
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-accent">تفاصيل المهمة</p>
            <h2 className="mt-1 text-2xl font-extrabold">{draft.title}</h2>
          </div>
          <button
            type="button"
            aria-label="إغلاق التفاصيل"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </header>

        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block text-slate-300">العنوان</span>
          <input
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none ring-brand focus:ring-2"
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block text-slate-300">الوصف</span>
          <textarea
            value={draft.description ?? ""}
            onChange={(event) => update({ description: event.target.value })}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none ring-brand focus:ring-2"
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block text-slate-300">الأولوية</span>
          <select
            value={draft.priority}
            onChange={(event) =>
              update({ priority: event.target.value as TaskPriority })
            }
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          <span className="mt-2 inline-block">
            <PriorityBadge priority={draft.priority} />
          </span>
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block text-slate-300">تاريخ الاستحقاق</span>
          <input
            type="date"
            value={draft.due_date ?? ""}
            onChange={(event) => update({ due_date: event.target.value || null })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
          />
          {draft.due_date ? (
            <p className="mt-2 text-sm text-slate-300">
              <TaskDateLabel iso={draft.due_date} calendar={calendar} />
            </p>
          ) : null}
        </label>

        {fields.length > 0 ? (
          <section className="mb-6 space-y-3">
            <h3 className="font-bold">الحقول المخصصة</h3>
            {fields.map((field) => {
              const value = fieldValue(draft, field.key);
              return (
                <label key={field.key} className="block text-sm">
                  <span className="mb-1.5 block text-slate-300">{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      value={String(value ?? "")}
                      onChange={(event) =>
                        update({
                          custom_fields: upsertFieldValue(
                            draft,
                            field.key,
                            event.target.value,
                          ),
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <option value="">—</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={value ?? ""}
                      onChange={(event) =>
                        update({
                          custom_fields: upsertFieldValue(
                            draft,
                            field.key,
                            field.type === "number"
                              ? event.target.value === ""
                                ? null
                                : Number(event.target.value)
                              : event.target.value,
                          ),
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    />
                  )}
                </label>
              );
            })}
          </section>
        ) : null}

        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 font-bold">
            <Paperclip className="size-4" aria-hidden />
            المرفقات
          </h3>
          <ul className="space-y-2">
            {attachments.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-accent hover:underline"
                >
                  {item.name}
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="text-slate-400 hover:text-white"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addAttachment} className="mt-3 space-y-2">
            <input
              value={linkName}
              onChange={(event) => setLinkName(event.target.value)}
              placeholder="اسم المرفق"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://"
                dir="ltr"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm"
              >
                <Link2 className="size-4" />
                إضافة
              </button>
            </div>
          </form>
        </section>

        <button
          type="button"
          onClick={() => onSave(draft)}
          className="mt-auto rounded-full bg-brand py-3 font-semibold"
        >
          حفظ التغييرات
        </button>
      </aside>
    </div>
  );
}
