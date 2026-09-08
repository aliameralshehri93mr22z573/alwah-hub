import { NextResponse } from "next/server";

export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/onboarding",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function redirectToAppPath(path: string, status = 303) {
  const location = safeInternalPath(path, "/login");
  return new NextResponse(null, {
    status,
    headers: { Location: location },
  });
}
