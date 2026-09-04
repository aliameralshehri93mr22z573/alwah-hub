import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/env";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
