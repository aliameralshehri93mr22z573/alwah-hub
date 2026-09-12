import { createClient } from "@supabase/supabase-js";

export function serviceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    ""
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceRoleKey();

  if (!url || !key) {
    console.error("[supabase/admin] missing URL or service_role key", {
      hasUrl: Boolean(url),
      hasServiceKey: Boolean(key),
    });
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
