"use client";

import { SessionSplash } from "@/components/auth/session-splash";
import { BrandLogo } from "@/components/icons/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authService } from "@/lib/services";
import type { UserRole } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

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
      <div className="flex min-h-full flex-1 items-center justify-center bg-warm-parchment">
        <SessionSplash label={user ? "Opening dashboard" : "Loading"} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-warm-parchment px-4 py-10">
      {/* Soft background accents */}
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-lime-sprout/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-forest-canopy/10 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-[420px]">
        <div className="rounded-[28px] border border-forest-canopy/10 bg-warm-parchment p-6 shadow-[0_24px_60px_-20px_rgba(28,58,19,0.18)] sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4">
              <BrandLogo size={48} />
            </span>
            <h1 className="text-heading-sm font-medium tracking-tight sm:text-heading">
              Welcome back
            </h1>
            <p className="mt-2 text-body-sm text-forest-canopy/70">
              Sign in to continue to NAUB Agric Connect
            </p>
          </div>

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
              showLiveHints
              required
            />
            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-body-sm text-red-700"
              >
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-body-sm text-forest-canopy/75">
            New here?{" "}
            <Link
              href="/register"
              className="font-medium text-forest-canopy underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-center text-[12px] text-forest-canopy/50">
            Demo: phone 08031112222 · password password123
          </p>
        </div>

        <p className="mt-5 text-center">
          <Link
            href="/"
            className="text-body-sm text-forest-canopy/60 underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-warm-parchment">
          <SessionSplash />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
