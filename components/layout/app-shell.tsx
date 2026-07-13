"use client";

import { MobileNav } from "./mobile-nav";
import { SiteHeader } from "./site-header";

export function AppShell({
  children,
  showMobileNav = true,
}: {
  children: React.ReactNode;
  showMobileNav?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-warm-parchment text-forest-canopy">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-12">
        {children}
      </main>
      {showMobileNav ? <MobileNav /> : null}
    </div>
  );
}
