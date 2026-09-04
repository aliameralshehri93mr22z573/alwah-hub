import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";
  const safeNext = next.startsWith("/") ? next : "/onboarding";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
