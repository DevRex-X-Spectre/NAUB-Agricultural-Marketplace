import { Badge } from "@/components/ui/badge";
import type { ListingStatus, VerificationStatus } from "@/lib/types";
import { Star } from "lucide-react";

const listingTone: Record<
  ListingStatus,
  { tone: "lime" | "stone" | "outline" | "inverse"; label: string }
> = {
  active: { tone: "lime", label: "Active" },
  sold: { tone: "stone", label: "Sold" },
  expired: { tone: "outline", label: "Expired" },
  flagged: { tone: "inverse", label: "Flagged" },
};

const verifyTone: Record<
  VerificationStatus,
  { tone: "lime" | "stone" | "outline" | "inverse"; label: string }
> = {
  verified: { tone: "lime", label: "Verified" },
  pending: { tone: "stone", label: "Pending" },
  suspended: { tone: "outline", label: "Suspended" },
  banned: { tone: "inverse", label: "Banned" },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const t = listingTone[status];
  return <Badge tone={t.tone}>{t.label}</Badge>;
}

export function VerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const t = verifyTone[status];
  return <Badge tone={t.tone}>{t.label}</Badge>;
}

export function FreshnessBadge({ days }: { days: number }) {
  if (days < 0) return <Badge tone="outline">Past expiry</Badge>;
  if (days <= 3) return <Badge tone="stone">{days}d left</Badge>;
  if (days <= 14) return <Badge tone="lime">{days}d fresh</Badge>;
  return <Badge tone="lime">Fresh</Badge>;
}

export function StarRating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const full = Math.min(5, Math.max(0, Math.round(value)));
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const text = size === "md" ? "text-body" : "text-body-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 ${text} text-forest-canopy`}
      aria-label={`${value} out of 5 stars`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`${iconSize} ${
              i < full
                ? "fill-forest-canopy text-forest-canopy"
                : "fill-none text-soft-sage"
            }`}
            strokeWidth={1.5}
          />
        ))}
      </span>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count != null ? (
        <span className="text-forest-canopy/60">({count})</span>
      ) : null}
    </span>
  );
}
