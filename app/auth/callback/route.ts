import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { safeInternalPath } from "@/lib/paths";
import { redirectToAppPath } from "@/lib/redirect-to-app-path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return redirectToAppPath("/login");
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectToAppPath(
        `/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  return redirectToAppPath(next, 307);
}
