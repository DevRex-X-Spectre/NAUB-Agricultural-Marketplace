import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** pale = Pale Stone band surface; parchment = default canvas */
  surface?: "parchment" | "pale" | "inverse";
};

export function Card({
  children,
  className = "",
  surface = "parchment",
}: CardProps) {
  const surfaces = {
    parchment: "bg-warm-parchment border border-forest-canopy/15",
    pale: "bg-pale-stone border border-forest-canopy/10",
    inverse: "bg-forest-canopy text-warm-parchment border border-forest-canopy",
  };

  return (
    <div
      className={[
        "rounded-2xl p-6",
        surfaces[surface],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
