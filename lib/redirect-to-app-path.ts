import { NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/paths";

export function redirectToAppPath(path: string, status = 303) {
  const location = safeInternalPath(path, "/login");
  return new NextResponse(null, {
    status,
    headers: { Location: location },
  });
}
