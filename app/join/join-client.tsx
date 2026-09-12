"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type AcceptResponse = {
  ok?: boolean;
  message?: string;
  token_hash?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  redirectTo?: string;
};

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE");
  }
  return createBrowserClient(url, anonKey);
}

async function establishBrowserSession(payload: AcceptResponse) {
  const supabase = browserClient();

  if (payload.token_hash) {
    const magic = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: payload.token_hash,
    });
    if (!magic.error) {
      return;
    }

    const email = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: payload.token_hash,
    });
    if (!email.error) {
      return;
    }

    console.error("[join] browser verifyOtp failed", {
      magic: magic.error.message,
      email: email.error.message,
    });
  }

  if (payload.access_token && payload.refresh_token) {
    const session = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });
    if (session.error) {
      console.error("[join] setSession failed", session.error);
    }
  }
}

export function JoinClient({ token }: { token: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = (await response.json().catch(() => null)) as
          | AcceptResponse
          | null;

        if (!response.ok || !payload?.ok) {
          const detail = payload?.message || `HTTP ${response.status}`;
          console.error("[join] accept API failed", {
            status: response.status,
            payload,
          });
          setMessage(detail);
          return;
        }

        try {
          await establishBrowserSession(payload);
        } catch (error) {
          console.error("[join] browser session failed", error);
        }

        setWelcome(true);
        router.refresh();
        router.push(payload.redirectTo || "/dashboard");
      } catch (error) {
        console.error("[join] accept request crashed", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "تعذّر تفعيل الدعوة. حاول مرة أخرى.",
        );
      }
    })();
  }, [router, token]);

  if (message) {
    return (
      <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
        {message}
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
      {welcome
        ? "أهلاً بك! جاري تجهيز مساحة العمل..."
        : "جارٍ تفعيل الدعوة ودخول مساحة العمل…"}
    </p>
  );
}
