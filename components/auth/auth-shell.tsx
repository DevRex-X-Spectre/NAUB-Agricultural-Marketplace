"use client";

import { BrandLogo } from "@/components/icons/brand-logo";
import { Check } from "lucide-react";

type AuthShellProps = {
  /** Right-panel page heading (e.g. "Welcome back") */
  heading: string;
  /** Right-panel supporting line under the heading */
  subheading: string;
  /** The form + actions for this auth screen */
  children: React.ReactNode;
  /** Mobile-only logo size override */
  mobileLogoSize?: number;
};

/**
 * Split-screen auth layout.
 *
 *  ┌───────────────────────┬──────────────────────┐
 *  │  Brand panel (dark)   │  Form panel (parchm.)│
 *  │  • logo + wordmark    │  • heading           │
 *  │  • value proposition  │  • {children}        │
 *  │  • value bullets      │  • cross-link        │
 *  │  • footer             │                      │
 *  └───────────────────────┴──────────────────────┘
 *
 * Brand panel is hidden below `lg`; form panel goes full-width on mobile
 * with a small inline brand mark at the top so the brand is never lost.
 */
export function AuthShell({
  heading,
  subheading,
  children,
  mobileLogoSize = 40,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* ─── Brand panel ─────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-forest-canopy lg:block">
        {/* Soft lime accents */}
        <div
          className="pointer-events-none absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-lime-sprout/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-20 h-[24rem] w-[24rem] rounded-full bg-lime-sprout/8 blur-3xl"
          aria-hidden
        />
        {/* Faint leaf glyph watermark */}
        <div
          className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.06]"
          aria-hidden
        >
          <svg width="320" height="320" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#d3fa99" />
            <path
              d="M 16 4 Q 4 12 4 18 Q 4 28 16 28 Q 28 28 28 18 Q 28 12 16 4 Z"
              fill="#1c3a13"
            />
          </svg>
        </div>

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Top: brand */}
          <BrandLogo size={44} withWordmark tone="light" />

          {/* Middle: value proposition */}
          <div className="flex max-w-md flex-col gap-6">
            <h2 className="text-[2.25rem] font-light leading-[1.1] tracking-[-1.2px] text-warm-parchment xl:text-[2.75rem]">
              From farm gate to WhatsApp, in minutes.
            </h2>
            <p className="text-body-lg leading-[1.55] text-warm-parchment/70">
              List produce, filter by LGA and freshness, and reach buyers
              directly on WhatsApp. Built for smallholder farmers and traders
              across Biu and surrounding Borno State LGAs.
            </p>

            <ul className="mt-2 flex flex-col gap-3">
              {[
                "Free to register — no listing fees",
                "Direct WhatsApp and phone contact with sellers",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-body text-warm-parchment/85"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-sprout/25">
                    <Check
                      className="h-3 w-3 text-lime-sprout"
                      strokeWidth={3}
                      aria-hidden
                    />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom: footer */}
          <div className="flex items-center gap-2 text-[12px] text-warm-parchment/45">
            <span className="inline-block h-1 w-1 rounded-full bg-lime-sprout/60" />
            {/* A final-year project · Nigerian Army University Biu */}
          </div>
        </div>
      </aside>

      {/* ─── Form panel ──────────────────────────────────────── */}
      <main className="relative flex items-center justify-center bg-warm-parchment px-5 py-10 sm:px-8 lg:py-14">
        <div className="w-full max-w-[440px]">
          {/* Mobile-only inline brand mark */}
          <div className="mb-9 flex justify-center lg:hidden">
            <BrandLogo size={mobileLogoSize} withWordmark />
          </div>

          <header className="mb-8">
            <h1 className="text-heading font-light tracking-[-0.8px] text-forest-canopy">
              {heading}
            </h1>
            <p className="mt-2 text-body text-forest-canopy/65">{subheading}</p>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
