import type { CSSProperties } from "react";

/**
 * NAUB Agric Connect brand mark — inline SVG so it ships with the bundle
 * and can be re-themed with the existing brand palette tokens.
 *
 *   forest-canopy  #1c3a13  (dark green — leaf, marks)
 *   lime-sprout    #d3fa99  (light lime — badge fill)
 *
 * The glyph combines a stylized leaf (agriculture) with a small
 * connect-arc + two nodes underneath (connect).
 */

type BrandLogoProps = {
  /** Pixel size for the icon badge. Default 32. */
  size?: number;
  /** Render the "NAUB Agric Connect" wordmark beside the icon. */
  withWordmark?: boolean;
  /** Show a small "Marketplace" eyebrow under the wordmark (header only). */
  withEyebrow?: boolean;
  /**
   * Wordmark text colour. `dark` (forest-canopy) for light surfaces,
   * `light` (warm-parchment) for the dark brand panel. Default `dark`.
   */
  tone?: "dark" | "light";
  className?: string;
  /** Forwarded to the inner <span> for layout tweaks. */
  style?: CSSProperties;
};

/**
 * SVG path drawn in a 32×32 viewBox. Shapes are designed for crisp
 * rendering at 24–64px without anti-aliasing fuzz.
 *
 * Leaf: a symmetric pointed teardrop, tip at top, rounded base.
 *   The classic almond/leaf shape: M 16 4 Q 4 12 4 18 Q 4 28 16 28 Q 28 28 28 18 Q 28 12 16 4 Z
 *   Tip pulled up to (16,4), widest at y=18, rounded bottom at y=28.
 *
 * Vein: a centered vertical line from the tip down to the base.
 */
const LEAF_PATH =
  "M 16 4 Q 4 12 4 18 Q 4 28 16 28 Q 28 28 28 18 Q 28 12 16 4 Z";
const VEIN_PATH = "M 16 7 L 16 25";

export function BrandLogo({
  size = 32,
  withWordmark = false,
  withEyebrow = false,
  tone = "dark",
  className,
  style,
}: BrandLogoProps) {
  const mark = (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role={withWordmark ? "presentation" : "img"}
      aria-label={withWordmark ? undefined : "NAUB Agric Connect"}
      className={className}
      style={style}
    >
      {/* Rounded-square badge */}
      <rect width="32" height="32" rx="8" fill="#d3fa99" />
      {/* Leaf */}
      <path d={LEAF_PATH} fill="#1c3a13" />
      {/* Vein (cut-out effect using badge colour) */}
      <path
        d={VEIN_PATH}
        stroke="#d3fa99"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Two side veins for the leaf */}
      <path
        d="M 16 12 Q 11 14 9 18"
        stroke="#d3fa99"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 16 12 Q 21 14 23 18"
        stroke="#d3fa99"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      {/* Connect-arc + nodes underneath the badge */}
      <path
        d="M 8 30 Q 16 27 24 30"
        stroke="#1c3a13"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="8" cy="30" r="1.6" fill="#1c3a13" />
      <circle cx="24" cy="30" r="1.6" fill="#1c3a13" />
    </svg>
  );

  if (!withWordmark) return mark;

  const wordmarkColor =
    tone === "light"
      ? "text-warm-parchment"
      : "text-forest-canopy";
  const eyebrowColor =
    tone === "light"
      ? "text-warm-parchment/55"
      : "text-forest-canopy/55";

  return (
    <span
      className="inline-flex items-center gap-2.5"
      aria-label="NAUB Agric Connect"
    >
      {mark}
      <span className="flex flex-col leading-none">
        <span
          className={`text-body font-medium tracking-[-0.4px] ${wordmarkColor}`}
        >
          NAUB Agric Connect
        </span>
        {withEyebrow ? (
          <span
            className={`mt-1 text-[10px] font-medium uppercase tracking-[0.18em] ${eyebrowColor}`}
          >
            Marketplace
          </span>
        ) : null}
      </span>
    </span>
  );
}