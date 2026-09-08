"use client";

import { useEffect, useRef, useState } from "react";
import { redeemInviteToken } from "@/app/join/actions";

export function JoinClient({ token }: { token: string }) {
  const started = useRef(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    void redeemInviteToken(token).then((result) => {
      if (result && !result.ok) {
        setMessage(result.message);
      }
    });
  }, [token]);

  if (message) {
    return (
      <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
        {message}
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
      جارٍ تفعيل الدعوة ودخول مساحة العمل…
    </p>
  );
}
