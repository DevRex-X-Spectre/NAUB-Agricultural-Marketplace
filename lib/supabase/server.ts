/**
 * Server Supabase client for Server Components / Route Handlers.
 * Uses cookie session from @supabase/ssr.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  assertSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/config";

export async function getSupabaseServerClient() {
  assertSupabaseConfigured();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // set from Server Component — middleware/proxy will refresh session
        }
      },
    },
  });
}
