import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/active-workspace";
import { activeWorkspaceCookieOptions } from "@/lib/active-workspace-server";
import { createAdminClient, serviceRoleKey } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type InviteRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  is_used: boolean;
};

function asWorkspaceRole(value: string) {
  return value === "admin" || value === "owner" ? value : "member";
}

async function findAuthUserIdByEmail(admin: AdminClient, email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceRoleKey();

  if (url && key) {
    try {
      const response = await fetch(
        `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${key}`,
            apikey: key,
          },
          cache: "no-store",
        },
      );
      if (response.ok) {
        const payload = (await response.json()) as {
          users?: { id: string; email?: string | null }[];
        };
        const match = payload.users?.find(
          (item) => item.email?.toLowerCase() === email,
        );
        if (match?.id) {
          return match.id;
        }
      }
    } catch (error) {
      console.error("[invites/accept] lookup auth user failed", error);
    }
  }

  const { data } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
  return (
    data.users.find((item) => item.email?.toLowerCase() === email)?.id ?? null
  );
}

async function ensureAuthUser(admin: AdminClient, email: string) {
  const existing = await findAuthUserIdByEmail(admin, email);
  if (existing) {
    return existing;
  }

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: email.split("@")[0] ?? "",
      invite_email: email,
      skip_workspace: "true",
    },
  });

  if (created.data.user?.id) {
    return created.data.user.id;
  }

  const again = await findAuthUserIdByEmail(admin, email);
  if (again) {
    return again;
  }

  throw new Error(created.error?.message ?? "تعذّر إنشاء حساب المعلم.");
}

async function sessionSecrets(
  admin: AdminClient,
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  userId: string,
) {
  const generated = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hashedToken = generated.data?.properties?.hashed_token ?? null;

  if (hashedToken) {
    return {
      tokenHash: hashedToken,
      accessToken: null as string | null,
      refreshToken: null as string | null,
    };
  }

  if (generated.error) {
    console.error("[invites/accept] generateLink failed", generated.error);
  }

  const password = `${randomBytes(24).toString("base64url")}Aa1!`;
  const updated = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (updated.error) {
    throw new Error(updated.error.message);
  }

  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    throw new Error(signedIn.error.message);
  }

  return {
    tokenHash: null as string | null,
    accessToken: signedIn.data.session?.access_token ?? null,
    refreshToken: signedIn.data.session?.refresh_token ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      token?: string;
    } | null;
    const token = body?.token?.trim() ?? "";

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "رابط الدعوة غير صالح." },
        { status: 400 },
      );
    }

    if (!isSupabaseConfigured()) {
      const error =
        "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing";
      console.error("Invite Activation Error:", error);
      return NextResponse.json(
        { ok: false, message: error, error, stage: "env" },
        { status: 503 },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      const error =
        "SUPABASE_SERVICE_ROLE_KEY is missing on the server. Add it in Render Environment, then redeploy.";
      console.error("Invite Activation Error:", error);
      return NextResponse.json(
        { ok: false, message: error, error, stage: "admin_client" },
        { status: 503 },
      );
    }

    const { data: invite, error: inviteError } = await admin
      .from("workspace_invites")
      .select("id, workspace_id, email, role, token, is_used")
      .eq("token", token)
      .maybeSingle();

    if (inviteError) {
      console.error("[invites/accept] invite lookup failed", inviteError);
      return NextResponse.json(
        { ok: false, message: "رابط الدعوة غير صالح أو منتهٍ." },
        { status: 400 },
      );
    }

    if (!invite) {
      return NextResponse.json(
        { ok: false, message: "رابط الدعوة غير صالح أو منتهٍ." },
        { status: 404 },
      );
    }

    const row = invite as InviteRow;
    const email = row.email.trim().toLowerCase();
    const role = asWorkspaceRole(row.role);
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let userId: string;
    let tokenHash: string | null = null;
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (currentUser?.email?.toLowerCase() === email) {
      userId = currentUser.id;
    } else {
      if (currentUser) {
        await supabase.auth.signOut();
      }
      userId = await ensureAuthUser(admin, email);
      const session = await sessionSecrets(admin, supabase, email, userId);
      tokenHash = session.tokenHash;
      accessToken = session.accessToken;
      refreshToken = session.refreshToken;
    }

    const profile = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        plan: "free",
      },
      { onConflict: "id" },
    );
    if (profile.error) {
      console.error("[invites/accept] profile upsert failed", profile.error);
    }

    const membership = await admin.from("workspace_members").upsert(
      {
        workspace_id: row.workspace_id,
        user_id: userId,
        role,
      },
      { onConflict: "workspace_id,user_id" },
    );
    if (membership.error) {
      console.error("[invites/accept] member upsert failed", membership.error);
      return NextResponse.json(
        { ok: false, message: membership.error.message },
        { status: 500 },
      );
    }

    if (!row.is_used) {
      const marked = await admin
        .from("workspace_invites")
        .update({ is_used: true })
        .eq("id", row.id)
        .eq("is_used", false);
      if (marked.error) {
        console.error("[invites/accept] mark used failed", marked.error);
      }
    }

    const response = NextResponse.json({
      ok: true,
      token_hash: tokenHash,
      access_token: accessToken,
      refresh_token: refreshToken,
      workspace_id: row.workspace_id,
      redirectTo: `/dashboard?workspace=${row.workspace_id}`,
    });
    response.cookies.set(
      ACTIVE_WORKSPACE_COOKIE,
      row.workspace_id,
      activeWorkspaceCookieOptions(),
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "unknown");
    console.error("Invite Activation Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message,
        error: message,
        stage: "unexpected",
      },
      { status: 500 },
    );
  }
}
