"use client";

import { isLocal } from "@/lib/config";
import { ensureSeeded } from "@/lib/seed";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthProvider } from "./auth-provider";
import { SystemAlertProvider } from "./system-alert-provider";

const SeedReadyContext = createContext(false);

export function useSeedReady() {
  return useContext(SeedReadyContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // localStorage seed only for Part A; Supabase uses supabase/seed.sql
        if (isLocal) {
          await ensureSeeded();
        }
      } catch (e) {
        console.error("Seed failed", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SystemAlertProvider>
      <SeedReadyContext.Provider value={ready}>
        <AuthProvider seedReady={ready}>{children}</AuthProvider>
      </SeedReadyContext.Provider>
    </SystemAlertProvider>
  );
}
