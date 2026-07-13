"use client";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Flag,
  Home,
  LayoutGrid,
  List,
  type LucideIcon,
  LogIn,
  Plus,
  Star,
  TrendingUp,
  User,
  Users,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; Icon: LucideIcon };

function itemsForRole(role?: string): NavItem[] {
  if (role === "farmer") {
    return [
      { href: "/farmer", label: "Home", Icon: Home },
      { href: "/farmer/listings", label: "Listings", Icon: List },
      { href: "/farmer/listings/new", label: "Sell", Icon: Plus },
      { href: "/farmer/contacts", label: "Inbox", Icon: Inbox },
      { href: "/browse", label: "Market", Icon: LayoutGrid },
    ];
  }
  if (role === "admin") {
    return [
      { href: "/admin", label: "Home", Icon: Home },
      { href: "/admin/users", label: "Users", Icon: Users },
      { href: "/admin/moderation", label: "Flags", Icon: Flag },
      { href: "/admin/prices", label: "Prices", Icon: TrendingUp },
      { href: "/browse", label: "Market", Icon: LayoutGrid },
    ];
  }
  return [
    { href: "/browse", label: "Browse", Icon: LayoutGrid },
    { href: "/cart", label: "Shortlist", Icon: Star },
    { href: "/buyer/contacts", label: "Contacts", Icon: Inbox },
    { href: "/transport", label: "Logistics", Icon: List },
    {
      href: role === "buyer" ? "/buyer" : "/login",
      label: role === "buyer" ? "Me" : "Sign in",
      Icon: role === "buyer" ? User : LogIn,
    },
  ];
}

export function MobileNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const items = itemsForRole(user?.role);

  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-forest-canopy/15 bg-warm-parchment pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/browse" &&
              item.href !== "/farmer" &&
              item.href !== "/admin" &&
              item.href !== "/buyer" &&
              pathname?.startsWith(item.href));
          const homeActive =
            (item.href === "/farmer" ||
              item.href === "/admin" ||
              item.href === "/buyer" ||
              item.href === "/browse") &&
            pathname === item.href;
          const isActive = active || homeActive;
          const { Icon } = item;
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                className={[
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] tracking-[-0.3px]",
                  isActive
                    ? "font-medium text-forest-canopy"
                    : "text-forest-canopy/55",
                ].join(" ")}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
