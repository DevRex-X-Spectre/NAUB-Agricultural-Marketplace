"use client";

import { BrandLogo } from "@/components/icons/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  type LucideIcon,
  Plus,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string; Icon: LucideIcon };

function roleHome(role: string) {
  if (role === "farmer") return "/farmer";
  if (role === "admin") return "/admin";
  return "/browse";
}

function primaryLinks(role?: string, signedIn?: boolean): NavLink[] {
  const links: NavLink[] = [
    { href: "/browse", label: "Browse market", Icon: LayoutGrid },
    { href: "/transport", label: "Logistics", Icon: Truck },
  ];
  if (signedIn) {
    links.push({ href: roleHome(role ?? "buyer"), label: "Dashboard", Icon: LayoutDashboard });
  }
  if (role === "farmer") {
    links.push({
      href: "/farmer/listings/new",
      label: "New listing",
      Icon: Plus,
    });
  }
  return links;
}

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on route change and on Escape
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Lock body scroll while the menu is open on small screens
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const links = primaryLinks(user?.role, !!user);

  return (
    <header className="sticky top-0 z-40 border-b border-forest-canopy/10 bg-warm-parchment/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link
          href="/"
          aria-label="NAUB Agric Connect — home"
          className="flex min-h-11 shrink-0 items-center rounded-full"
        >
          {/* Mobile: just the mark */}
          <span className="sm:hidden">
            <BrandLogo size={36} />
          </span>
          {/* Tablet / desktop: full lockup */}
          <span className="hidden sm:inline-flex">
            <BrandLogo size={36} withWordmark withEyebrow />
          </span>
        </Link>

        {/* ── Desktop / tablet nav (≥ sm) ─────────────────────── */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {links.slice(0, 2).map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center px-3 text-body-sm transition-colors",
                  active
                    ? "font-medium text-forest-canopy"
                    : "text-forest-canopy/75 hover:text-forest-canopy",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}

          {!loading && user ? (
            <>
              <Link href={roleHome(user.role)}>
                <Button
                  variant="secondary"
                  className="!py-2 !px-3 text-body-sm"
                >
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

        {/* ── Mobile hamburger (< sm) ─────────────────────────── */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-forest-canopy transition-colors hover:bg-pale-stone sm:hidden"
        >
          {menuOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {/* ── Mobile menu sheet ─────────────────────────────────── */}
      {menuOpen ? (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-true-black/35 sm:hidden"
          />

          {/* Panel */}
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            className="fixed inset-x-0 top-[57px] z-50 origin-top animate-[slideDown_180ms_ease-out] border-b border-forest-canopy/10 bg-warm-parchment pb-6 pt-2 shadow-[0_24px_60px_-20px_rgba(28,58,19,0.18)] sm:hidden"
          >
            <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4">
              {/* Primary links */}
              <ul className="flex flex-col py-2">
                {links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/browse" &&
                      pathname?.startsWith(link.href));
                  const { Icon } = link;
                  return (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex min-h-12 items-center gap-3 rounded-xl px-3 text-body transition-colors",
                          active
                            ? "bg-lime-sprout/30 font-medium text-forest-canopy"
                            : "text-forest-canopy hover:bg-pale-stone",
                        ].join(" ")}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          strokeWidth={active ? 2.25 : 1.75}
                          aria-hidden
                        />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link
                    href="/"
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-body text-forest-canopy hover:bg-pale-stone"
                  >
                    <Home
                      className="h-4 w-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    Home
                  </Link>
                </li>
              </ul>

              <hr className="my-2 border-forest-canopy/10" />

              {/* Auth actions */}
              <div className="flex flex-col gap-2 py-2">
                {!loading && user ? (
                  <>
                    <Link href={roleHome(user.role)} className="w-full">
                      <Button variant="secondary" className="w-full">
                        <LayoutDashboard className="h-4 w-4" aria-hidden />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-center"
                      onClick={() => void logout()}
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Log out
                    </Button>
                  </>
                ) : !loading && !isAuthPage ? (
                  <>
                    <Link href="/login" className="w-full">
                      <Button variant="secondary" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/register" className="w-full">
                      <Button className="w-full">Create account</Button>
                    </Link>
                  </>
                ) : null}
              </div>

              {!loading && user ? (
                <p className="mt-3 px-3 text-[12px] text-forest-canopy/55">
                  Signed in as{" "}
                  <span className="font-medium text-forest-canopy">
                    {user.full_name}
                  </span>
                  {" · "}
                  {user.role}
                </p>
              ) : null}
            </div>
          </div>

          {/* Animation keyframes (Tailwind v4 arbitrary value) */}
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </>
      ) : null}
    </header>
  );
}