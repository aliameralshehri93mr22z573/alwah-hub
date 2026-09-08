import { isSupabaseConfigured } from "@/utils/supabase/env";

export function logMissingSupabaseEnv(route: string) {
  if (isSupabaseConfigured()) {
    return;
  }

  console.error(
    `[auth/${route}] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined`,
  );
}

export function logAuthRouteError(route: string, error: unknown) {
  console.error(`[auth/${route}] failed to load`, error);
}
