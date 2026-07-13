"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth roles={["buyer"]}>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
