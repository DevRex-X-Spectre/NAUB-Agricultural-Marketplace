"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth roles={["admin"]}>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

// Auth-gated routes are client-session based (localStorage / Supabase)
export const dynamic = "force-dynamic";

