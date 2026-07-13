"use client";

import { SessionSplash } from "@/components/auth/session-splash";
import { BrandLogo } from "@/components/icons/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
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
      const login = await authService.login(phone, password);
      if (login.success && login.data) {
        setUser(login.data.user);
        const home: Record<UserRole, string> = {
          farmer: "/farmer",
          buyer: "/browse",
          admin: "/admin",
        };
        window.location.assign(home[login.data.user.role]);
        return;
      }
      setError(login.error ?? "Account created. Please sign in.");
      setSubmitting(false);
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
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime-sprout/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-forest-canopy/10 blur-3xl"
        aria-hidden
      />

      <div
        className={[
          "relative w-full max-w-[440px]",
          "transition-all duration-500 ease-out",
          mounted
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-[0.96] opacity-0",
        ].join(" ")}
      >
        <div className="rounded-[28px] border border-forest-canopy/10 bg-warm-parchment p-6 shadow-[0_24px_60px_-20px_rgba(28,58,19,0.18)] sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4">
              <BrandLogo size={48} />
            </span>
            <h1 className="text-heading-sm font-medium tracking-tight sm:text-heading">
              Create account
            </h1>
            <p className="mt-2 text-body-sm text-forest-canopy/70">
              Under three minutes. Your WhatsApp number is your contact on listings.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset>
              <legend className="mb-2 text-body-sm font-medium">I am a…</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "farmer", label: "Farmer" },
                    { value: "buyer", label: "Buyer" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={[
                      "min-h-11 rounded-full border px-3 py-2 text-body-sm font-medium transition-colors",
                      role === opt.value
                        ? "border-forest-canopy bg-forest-canopy text-warm-parchment"
                        : "border-forest-canopy/25 bg-warm-parchment text-forest-canopy",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <Input
              label="Full name"
              name="full_name"
              autoComplete="name"
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
              hint="This number is used for WhatsApp contact on listings (buyers and farmers)."
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

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-body-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-body-sm text-forest-canopy/75">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-warm-parchment">
          <SessionSplash />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
