"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const res = await authService.login(phone, password);
      if (!res.success || !res.data) {
        setError(res.error ?? "Sign in failed");
        return;
      }
      setUser(res.data.user);
      const next = params.get("next");
      router.replace(next || roleHome(res.data.user.role));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell showMobileNav={false}>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-heading font-light tracking-[-0.8px]">Sign in</h1>
        <p className="mt-2 text-body-sm text-forest-canopy/75">
          Sign in with your phone and password. Demo accounts use password{" "}
          <strong className="font-medium">password123</strong> (e.g. farmer{" "}
          <span className="font-mono text-[13px]">08031112222</span>, buyer{" "}
          <span className="font-mono text-[13px]">08037778888</span>).{" "}
          <Link
            href="/register"
            className="font-medium underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>

        <Card className="mt-6 !p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Phone number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0803…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-pale-stone px-3 py-3 text-body-sm text-forest-canopy"
              >
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-body-sm text-forest-canopy/80">
          New here?{" "}
          <Link href="/register" className="font-medium underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-forest-canopy/70">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
