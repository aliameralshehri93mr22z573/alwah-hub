"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getFirstBoardId } from "@/lib/onboarding";
import { createAdminClient } from "@/utils/supabase/admin";
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

export type RedeemInviteResult = { ok: false; message: string };

function asWorkspaceRole(value: string) {
  return value === "admin" || value === "owner" ? value : "member";
}

async function findAuthUserIdByEmail(admin: AdminClient, email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    try {
      const response = await fetch(
        `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
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
    } catch {
      // Fall through to a bounded listUsers scan.
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

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: email.split("@")[0] ?? "" },
  });

  if (data.user?.id) {
    return data.user.id;
  }

  const again = await findAuthUserIdByEmail(admin, email);
  if (again) {
    return again;
  }

  throw new Error(error?.message ?? "تعذّر إنشاء حساب المعلم.");
}

async function establishSession(
  admin: AdminClient,
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  userId: string,
) {
  const generated = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hashedToken = generated.data?.properties?.hashed_token;

  if (hashedToken) {
    const magic = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashedToken,
    });
    if (!magic.error) {
      return;
    }

    const emailOtp = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: hashedToken,
    });
    if (!emailOtp.error) {
      return;
    }
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
}

export async function redeemInviteToken(
  token: string,
): Promise<RedeemInviteResult> {
  const normalized = token.trim();
  if (!normalized) {
    return { ok: false, message: "رابط الدعوة غير صالح." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "تعذّر تفعيل الدعوة حالياً." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "تعذّر تفعيل الدعوة. تواصل مع مدير النظام." };
  }

  const { data: invite, error: inviteError } = await admin
    .from("workspace_invites")
    .select("id, workspace_id, email, role, token, is_used")
    .eq("token", normalized)
    .maybeSingle();

  if (inviteError || !invite) {
    return { ok: false, message: "رابط الدعوة غير صالح أو منتهٍ." };
  }

  const row = invite as InviteRow;
  const email = row.email.trim().toLowerCase();
  const role = asWorkspaceRole(row.role);
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let userId: string;
  if (currentUser?.email?.toLowerCase() === email) {
    userId = currentUser.id;
  } else {
    if (currentUser) {
      await supabase.auth.signOut();
    }
    try {
      userId = await ensureAuthUser(admin, email);
      await establishSession(admin, supabase, email, userId);
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذّر تسجيل الدخول عبر رابط الدعوة.",
      };
    }
  }

  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      plan: "free",
    },
    { onConflict: "id" },
  );

  const { error: memberError } = await admin.from("workspace_members").upsert(
    {
      workspace_id: row.workspace_id,
      user_id: userId,
      role,
    },
    { onConflict: "workspace_id,user_id" },
  );

  if (memberError) {
    return { ok: false, message: memberError.message };
  }

  if (!row.is_used) {
    await admin
      .from("workspace_invites")
      .update({ is_used: true })
      .eq("id", row.id);
  }

  const boardId = await getFirstBoardId(admin, row.workspace_id);
  redirect(
    boardId ? `/dashboard/boards/${boardId}` : "/dashboard",
  );
}
