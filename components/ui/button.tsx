import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-forest-canopy text-warm-parchment hover:opacity-90 disabled:bg-quiet-gray disabled:text-warm-parchment",
  secondary:
    "bg-pale-stone text-forest-canopy border border-forest-canopy/20 hover:bg-lime-sprout/40 disabled:bg-soft-sage disabled:text-forest-canopy/50",
  ghost:
    "bg-transparent text-forest-canopy underline-offset-4 hover:underline disabled:text-quiet-gray",
  inverse:
    "bg-warm-parchment text-forest-canopy hover:bg-lime-sprout disabled:bg-soft-sage",
};

/**
 * Filled Pill CTA — DESIGN.md primary action.
 * Fully rounded, Forest Canopy fill, no box-shadow.
 */
export function Button({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2",
        "rounded-full font-medium text-body-sm tracking-[-0.42px]",
        "px-4 py-3 min-h-11 tap-target",
        "transition-opacity disabled:cursor-not-allowed",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
