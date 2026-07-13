"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function roleHome(role: string) {
  if (role === "farmer") return "/farmer";
  if (role === "admin") return "/admin";
  return "/browse";
}

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  return (
    <header className="sticky top-0 z-40 border-b border-forest-canopy/10 bg-warm-parchment/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-sprout">
            <Leaf className="h-4 w-4 text-forest-canopy" aria-hidden />
          </span>
          <span className="text-body font-medium tracking-[-0.4px]">
            NAUB Agri
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/browse"
            className="hidden min-h-11 items-center px-2 text-body-sm text-forest-canopy sm:inline-flex hover:underline underline-offset-4"
          >
            Browse
          </Link>
          <Link
            href="/transport"
            className="hidden min-h-11 items-center px-2 text-body-sm text-forest-canopy md:inline-flex hover:underline underline-offset-4"
          >
            Logistics
          </Link>

          {!loading && user ? (
            <>
              <Link href={roleHome(user.role)}>
                <Button variant="secondary" className="!py-2 !px-3 text-body-sm">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="!py-2 !px-2 text-body-sm"
                onClick={() => void logout()}
              >
                Log out
              </Button>
            </>
          ) : !loading && !isAuthPage ? (
            <>
              <Link href="/login">
                <Button variant="ghost" className="!py-2 !px-3 text-body-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="!py-2 !px-3 text-body-sm">Join</Button>
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
