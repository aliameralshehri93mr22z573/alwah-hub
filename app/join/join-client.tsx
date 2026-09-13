"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type InviteRow = {
  id?: string;
  workspace_id: string;
  email?: string | null;
  role?: string | null;
  token?: string;
  is_used?: boolean | null;
};

type AcceptResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  stage?: string;
  token_hash?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  workspace_id?: string;
  redirectTo?: string;
};

const WORKSPACE_COOKIE = "alwahhub_workspace";

function formatError(error: unknown) {
  if (!error) {
    return "Unknown error";
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(url, anonKey);
}

function persistGuestIdentity(workspaceId: string, email?: string | null) {
  try {
    window.localStorage.setItem("current_workspace_id", workspaceId);
    if (email) {
      window.localStorage.setItem("member_email", email);
    }
  } catch (error) {
    console.error("Invite Activation Error:", error);
  }
  document.cookie = `${WORKSPACE_COOKIE}=${workspaceId}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

async function lookupInvite(token: string): Promise<InviteRow> {
  const supabase = browserClient();
  const table = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("token", token)
    .single();

  if (table.data?.workspace_id) {
    return table.data as InviteRow;
  }

  if (table.error) {
    console.error("Invite Activation Error:", table.error);
  }

  const rpc = await supabase.rpc("lookup_invite_by_token", { p_token: token });
  if (rpc.error) {
    console.error("Invite Activation Error:", rpc.error);
    throw new Error(
      table.error?.message
        ? `${table.error.message} | RPC: ${rpc.error.message}`
        : rpc.error.message,
    );
  }

  const payload = rpc.data as InviteRow | null;
  if (!payload?.workspace_id) {
    throw new Error(
      table.error?.message || "رابط الدعوة غير صالح أو منتهٍ.",
    );
  }
  return payload;
}

async function ensureGuestSession(invite: InviteRow) {
  const supabase = browserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    console.error("Invite Activation Error:", userError);
  }
  if (user) {
    return user;
  }

  const anonymous = await supabase.auth.signInAnonymously({
    options: {
      data: {
        full_name: invite.email?.split("@")[0] ?? "معلم",
        invite_email: invite.email ?? "",
      },
    },
  });
  if (anonymous.data.user) {
    return anonymous.data.user;
  }

  console.error("Invite Activation Error:", anonymous.error);
  if (invite.email) {
    const otp = await supabase.auth.signInWithOtp({
      email: invite.email,
      options: { shouldCreateUser: true },
    });
    if (otp.error) {
      console.error("Invite Activation Error:", otp.error);
      throw new Error(
        `${anonymous.error?.message ?? "Anonymous sign-in failed"} | ${otp.error.message}`,
      );
    }
    throw new Error(
      "تم إرسال رابط الدخول إلى البريد. افتح الرسالة لإكمال الانضمام.",
    );
  }

  throw new Error(
    anonymous.error?.message ??
      "تعذّر إنشاء جلسة ضيف. فعّل Anonymous Auth في Supabase أو اضبط SUPABASE_SERVICE_ROLE_KEY.",
  );
}

async function acceptInvite(token: string, invite: InviteRow) {
  const supabase = browserClient();
  const role =
    invite.role === "admin" || invite.role === "owner" ? invite.role : "member";

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const member = await supabase.from("workspace_members").upsert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role,
    });
    if (member.error) {
      console.error("Invite Activation Error:", member.error);
    }
    const marked = await supabase
      .from("workspace_invites")
      .update({ is_used: true })
      .eq("token", token);
    if (marked.error) {
      console.error("Invite Activation Error:", marked.error);
    }
  }

  const rpc = await supabase.rpc("accept_invite_by_token", { p_token: token });
  if (rpc.error) {
    console.error("Invite Activation Error:", rpc.error);
    throw new Error(rpc.error.message);
  }
  const payload = rpc.data as { ok?: boolean; message?: string } | null;
  if (payload && payload.ok === false) {
    throw new Error(payload.message || "تعذّر قبول الدعوة.");
  }
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

    console.error("Invite Activation Error:", {
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
      console.error("Invite Activation Error:", session.error);
    }
  }
}

async function acceptViaApi(token: string) {
  const response = await fetch("/api/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const payload = (await response.json().catch(() => null)) as
    | AcceptResponse
    | null;
  if (!response.ok || !payload?.ok) {
    const detail =
      payload?.error ||
      payload?.message ||
      `HTTP ${response.status}`;
    throw new Error(detail);
  }
  await establishBrowserSession(payload);
  return payload;
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
      const errors: string[] = [];
      try {
        try {
          const payload = await acceptViaApi(token);
          const workspaceId = payload.workspace_id;
          if (workspaceId) {
            persistGuestIdentity(workspaceId);
          }
          setWelcome(true);
          router.refresh();
          router.push(
            workspaceId
              ? `/dashboard?workspace=${workspaceId}`
              : payload.redirectTo || "/dashboard",
          );
          return;
        } catch (error) {
          console.error("Invite Activation Error:", error);
          errors.push(`API: ${formatError(error)}`);
        }

        const invite = await lookupInvite(token);
        await ensureGuestSession(invite);
        await acceptInvite(token, invite);
        persistGuestIdentity(invite.workspace_id, invite.email);
        setWelcome(true);
        router.refresh();
        router.push(`/dashboard?workspace=${invite.workspace_id}`);
      } catch (error) {
        console.error("Invite Activation Error:", error);
        errors.push(formatError(error));
        setMessage(errors.join("\n"));
      }
    })();
  }, [router, token]);

  if (message) {
    return (
      <div className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
        <p className="font-semibold">Invite Activation Error</p>
        <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-red-100">
          {message}
        </pre>
      </div>
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
