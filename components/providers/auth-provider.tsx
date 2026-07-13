"use client";

import { authService } from "@/lib/services";
import type { PublicUser, UserRole } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  seedReady = true,
}: {
  children: React.ReactNode;
  seedReady?: boolean;
}) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await authService.getCurrentUser();
    if (result.success) {
      setUser(result.data ?? null);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!seedReady) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await authService.getCurrentUser();
        if (!cancelled) {
          setUser(result.success ? (result.data ?? null) : null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seedReady]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading: loading || !seedReady, refresh, logout, setUser }),
    [user, loading, seedReady, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const SSR_FALLBACK: AuthContextValue = {
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
  setUser: () => {},
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  // Soft fallback avoids static prerender crashes; client always has AuthProvider.
  return ctx ?? SSR_FALLBACK;
}

export function useRequireAuth(roles?: UserRole[]) {
  const auth = useAuth();
  const allowed =
    !!auth.user && (!roles || roles.includes(auth.user.role));
  return { ...auth, allowed };
}
