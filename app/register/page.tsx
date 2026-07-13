"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LGA_OPTIONS } from "@/lib/config";
import { authService } from "@/lib/services";
import type { UserRole } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();

  const initialRole = useMemo(() => {
    const r = params.get("role");
    return r === "buyer" ? "buyer" : "farmer";
  }, [params]);

  const [role, setRole] = useState<"farmer" | "buyer">(initialRole);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [lga, setLga] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const reg = await authService.register({
        full_name: fullName,
        phone,
        lga,
        role,
        password,
      });
      if (!reg.success) {
        setError(reg.error ?? "Registration failed");
        return;
      }
      // Auto-login after register
      const login = await authService.login(phone, password);
      if (login.success && login.data) {
        setUser(login.data.user);
        const home: Record<UserRole, string> = {
          farmer: "/farmer",
          buyer: "/browse",
          admin: "/admin",
        };
        router.replace(home[login.data.user.role]);
      } else {
        router.replace("/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell showMobileNav={false}>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-heading font-light tracking-[-0.8px]">
          Create account
        </h1>
        <p className="mt-2 text-body-sm text-forest-canopy/75">
          Under three minutes. Phone-first no email required.
        </p>

        <Card className="mt-6 !p-5">
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
                      "min-h-11 rounded-full border px-3 py-2 text-body-sm font-medium",
                      role === opt.value
                        ? "border-forest-canopy bg-forest-canopy text-warm-parchment"
                        : "border-forest-canopy/25 bg-warm-parchment text-forest-canopy",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {role === "farmer" ? (
                <p className="mt-2 text-body-sm text-forest-canopy/65">
                  After signup you can create listings right away and reach buyers
                  in your LGA.
                </p>
              ) : (
                <p className="mt-2 text-body-sm text-forest-canopy/65">
                  Browse the market and contact farmers on WhatsApp or phone.
                </p>
              )}
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
            <Select
              label="Local Government Area (LGA)"
              name="lga"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              placeholder="Select LGA"
              options={LGA_OPTIONS.map((x) => ({ value: x, label: x }))}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              hint="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-pale-stone px-3 py-3 text-body-sm"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-body-sm text-forest-canopy/80">
          Already registered?{" "}
          <Link href="/login" className="font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-forest-canopy/70">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
