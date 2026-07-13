import type { ReactNode } from "react";

type BadgeTone = "lime" | "stone" | "outline" | "inverse";

const tones: Record<BadgeTone, string> = {
  lime: "bg-lime-sprout text-forest-canopy",
  stone: "bg-pale-stone text-forest-canopy",
  outline: "bg-transparent text-forest-canopy border border-forest-canopy/30",
  inverse: "bg-forest-canopy text-warm-parchment",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

/** Product Badge Tag — pill status indicator (DESIGN.md) */
export function Badge({ children, tone = "lime", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        "px-2.5 py-1 text-[12px] font-medium tracking-[-0.3px]",
        tones[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

