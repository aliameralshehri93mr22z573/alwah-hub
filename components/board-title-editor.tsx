"use client";

import { useEffect, useRef, useState } from "react";

export function BoardTitleEditor({
  title,
  onSave,
  className = "text-3xl font-extrabold",
}: {
  title: string;
  onSave: (nextTitle: string) => Promise<void> | void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function commit() {
    const nextTitle = draft.trim();
    if (!nextTitle || nextTitle === title) {
      setDraft(title);
      setEditing(false);
      return;
    }
    setPending(true);
    await onSave(nextTitle);
    setPending(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`${className} rounded-lg text-start hover:bg-white/5`}
        title="اضغط لتعديل اسم اللوحة"
      >
        {title}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      disabled={pending}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        void commit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void commit();
        }
        if (event.key === "Escape") {
          setDraft(title);
          setEditing(false);
        }
      }}
      className={`${className} w-full max-w-xl rounded-lg border border-white/15 bg-white/5 px-2 py-1 outline-none ring-brand focus:ring-2`}
      aria-label="اسم اللوحة"
    />
  );
}
