"use client";

import { AuthError } from "@/components/auth/auth-error";
import { AuthShell } from "@/components/auth/auth-shell";
import { SessionSplash } from "@/components/auth/session-splash";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Toast } from "@/components/ui/toast";
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
  const [success, setSuccess] = useState<string | null>(null);

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
      // Show a success toast before we commit the session + hard-navigate,
      // so the user gets visible confirmation instead of an instant page swap.
      const firstName = (res.data.user.full_name || "").split(" ")[0] || "there";
      setSuccess(`Welcome back, ${firstName}!`);
      // Keep the button in its loading state during the beat.
      const next = params.get("next") || roleHome(res.data.user.role);
      window.setTimeout(() => {
        setUser(res.data!.user);
        window.location.assign(next);
      }, 1200);
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
      </div>

      <Toast
        open={!!success}
        variant="success"
        title={success ?? ""}
        description="Taking you to your dashboard…"
      />
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
