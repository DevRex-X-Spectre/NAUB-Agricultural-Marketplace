"use client";

import { BrandLogo } from "@/components/icons/brand-logo";

/**
 * Minimal branded splash shown while the session resolves or during a
 * post-auth redirect. Used in place of a blank "Checking session…" page.
 */
export function SessionSplash({
  label = "Almost there",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-2xl bg-lime-sprout/40"
          style={{ animationDuration: "1.6s" }}
          aria-hidden
        />
        <span className="relative">
          <BrandLogo size={64} />
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-body font-medium text-forest-canopy">{label}</p>
        <p className="text-body-sm text-forest-canopy/55">
          NAUB Agric Connect
        </p>
      </div>
    </div>
  );
}