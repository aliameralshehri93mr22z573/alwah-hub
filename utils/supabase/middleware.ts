import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirectToAppPath } from "@/lib/redirect-to-app-path";

const PROTECTED_PREFIXES = ["/dashboard", "/boards", "/onboarding", "/checkout"];
const AUTH_PUBLIC_PREFIXES = ["/login", "/register", "/signup"];

function hasPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    if (hasPrefix(pathname, AUTH_PUBLIC_PREFIXES)) {
      return supabaseResponse;
    }

    if (!user && hasPrefix(pathname, PROTECTED_PREFIXES)) {
      const next = `${pathname}${request.nextUrl.search}`;
      return redirectToAppPath(`/login?next=${encodeURIComponent(next)}`);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[middleware] session update failed", error);
    return NextResponse.next({ request });
  }
}
