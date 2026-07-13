"use client";

import { AuthError } from "@/components/auth/auth-error";
import { AuthShell } from "@/components/auth/auth-shell";
import { SessionSplash } from "@/components/auth/session-splash";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authService } from "@/lib/services";
import type { UserRole } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";

function roleHome(role: UserRole) {
  if (role === "farmer") return "/farmer";
  if (role === "admin") return "/admin";
  return "/browse";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, user, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: go straight to dashboard (no form flash)
  useEffect(() => {
    if (!loading && user) {
      router.replace(params.get("next") || roleHome(user.role));
    }
  }, [loading, user, router, params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authService.login(identifier, password);
      if (!res.success || !res.data) {
        setError(res.error ?? "Sign in failed");
        setSubmitting(false);
        return;
      }
      // Set session first, then hard-navigate so RequireAuth never shows a wait state
      setUser(res.data.user);
      const next = params.get("next") || roleHome(res.data.user.role);
      window.location.assign(next);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-parchment">
        <SessionSplash label={user ? "Opening dashboard" : "Loading"} />
      </div>
    );
  }

  return (
    <AuthShell
      heading="Welcome back"
      subheading="Sign in with your email or phone to continue to NAUB Agric Connect."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Email or phone number"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="you@example.com or 0803…"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? (
          <AuthError error={error} email={identifier} />
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4">
        <p className="text-body-sm text-forest-canopy/70">
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-forest-canopy underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p className="text-center text-[12px] text-forest-canopy/45">
          Demo · phone 08031112222 · password password123
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-warm-parchment">
          <SessionSplash />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
