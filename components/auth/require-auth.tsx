"use client";

import { SessionSplash } from "@/components/auth/session-splash";
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
 * Client-side route guard.
 * If user is already known, render immediately (no blank session screen).
 * Only shows a brief splash while auth is still hydrating.
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

  // Already authenticated: never block on a full-page "checking" message
  if (user) {
    if (roles && !roles.includes(user.role)) {
      return <SessionSplash label="Redirecting" />;
    }
    return <>{children}</>;
  }

  if (loading) {
    return <SessionSplash label="Loading your account" />;
  }

  // Redirecting to login
  return <SessionSplash label="Redirecting to sign in" />;
}
