/**
 * Next.js 16 Proxy (formerly middleware) — refreshes Supabase auth cookies.
 * Only active logic when Supabase env is configured.
 */
import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|demo-images/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
