"use client";

import { BrandLogo } from "@/components/icons/brand-logo";

/**
 * Minimal branded splash while session is resolved.
 * Used instead of a blank "Checking session..." page.
 */
export function SessionSplash({ label = "Almost there" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-lime-sprout/40"
          style={{ animationDuration: "1.4s" }}
          aria-hidden
        />
        <span className="relative">
          <BrandLogo size={56} />
        </span>
      </div>
      <p className="text-body-sm text-forest-canopy/60">{label}</p>
    </div>
  );
}
