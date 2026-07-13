"use client";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROLE_HOME: Record<UserRole, string> = {
  farmer: "/farmer",
  buyer: "/browse",
  admin: "/admin",
};

type Props = {
  roles?: UserRole[];
  children: React.ReactNode;
};

/**
 * Client-side route guard for localStorage sessions.
 * Redirects unauthenticated users to /login; wrong role to their home.
 */
export function RequireAuth({ roles, children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, roles, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-body text-forest-canopy/70">
        Checking session…
      </div>
    );
  }

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
