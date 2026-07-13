"use client";

import { AuthError } from "@/components/auth/auth-error";
import { AuthShell } from "@/components/auth/auth-shell";
import { SessionSplash } from "@/components/auth/session-splash";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { LGA_OPTIONS } from "@/lib/config";
import { authService } from "@/lib/services";
import type { UserRole } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, user, loading } = useAuth();

  const initialRole = useMemo(() => {
    const r = params.get("role");
    return r === "buyer" ? "buyer" : "farmer";
  }, [params]);

  const [role, setRole] = useState<"farmer" | "buyer">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lga, setLga] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    title: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const home: Record<UserRole, string> = {
        farmer: "/farmer",
        buyer: "/browse",
        admin: "/admin",
      };
      router.replace(home[user.role]);
    }
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const reg = await authService.register({
        full_name: fullName,
        email,
        phone,
        lga,
        role,
        password,
      });
      if (!reg.success) {
        setError(reg.error ?? "Registration failed");
        setSubmitting(false);
        return;
      }
      // Registration succeeded. Now check whether Supabase established a
      // live session (email confirmation OFF → auto-confirmed) or whether
      // the user still needs to confirm their email (confirmation ON).
      // We deliberately do NOT call login() again — that would re-run the
      // password check and surface a misleading "wrong password"-style
      // error when the real situation is "email not confirmed yet".
      const session = await authService.getCurrentUser();
      if (session.success && session.data) {
        const firstName =
          (session.data.full_name || "").split(" ")[0] || "there";
        const home: Record<UserRole, string> = {
          farmer: "/farmer",
          buyer: "/browse",
          admin: "/admin",
        };
        setSuccess({
          title: `Welcome aboard, ${firstName}!`,
          description: "Your account is ready. Taking you to your dashboard…",
        });
        const target = home[session.data.role];
        window.setTimeout(() => {
          setUser(session.data!);
          window.location.assign(target);
        }, 1500);
        return;
      }
      // No live session → email confirmation is enabled on the Supabase
      // project. Show an honest "check your email" state — NOT an error.
      setSuccess({
        title: "Check your email to finish",
        description:
          "We sent a confirmation link. Click it, then sign in. (If you run this project, turn OFF email confirmation in Supabase → Authentication → Providers → Email.)",
      });
      setSubmitting(false);
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
      heading="Create your account"
      subheading="Under three minutes. Your WhatsApp number is your contact on every listing."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Role selector */}
        <fieldset>
          <legend className="mb-2 text-body-sm font-medium text-forest-canopy">
            I am a…
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "farmer", label: "Farmer" },
                { value: "buyer", label: "Buyer" },
              ] as const
            ).map((opt) => {
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  aria-pressed={active}
                  className={[
                    "min-h-12 rounded-xl border px-3 py-2 text-body-sm font-medium transition-colors",
                    active
                      ? "border-forest-canopy bg-forest-canopy text-warm-parchment"
                      : "border-forest-canopy/20 bg-warm-parchment text-forest-canopy hover:bg-pale-stone",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Input
          label="Full name"
          name="full_name"
          autoComplete="name"
          placeholder="e.g. Musa Ibrahim"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="WhatsApp phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0803…"
          hint="Used as your contact on listings (buyers and farmers)."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Select
          label="Local Government Area (LGA)"
          name="lga"
          value={lga}
          onChange={(e) => setLga(e.target.value)}
          placeholder="Select LGA"
          options={LGA_OPTIONS.map((x) => ({ value: x, label: x }))}
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          showLiveHints
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error ? <AuthError error={error} email={email} /> : null}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-body-sm text-forest-canopy/70">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-forest-canopy underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <Toast
        open={!!success}
        variant="success"
        title={success?.title ?? ""}
        description={success?.description}
      />
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-warm-parchment">
          <SessionSplash />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
