"use client";

import { FreshnessBadge, ListingStatusBadge, StarRating } from "./status-badge";
import { formatNaira, daysUntil } from "@/lib/utils/format";
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

type Props = {
  product: Product;
  farmerName?: string;
  farmerRating?: number;
  href?: string;
  showStatus?: boolean;
};

/**
 * Tint a placeholder background so each category gets its own colour band
 * when no photo is available. Stable across renders.
 */
function placeholderBg(seed: number): string {
  const palette = [
    "bg-lime-sprout/40",
    "bg-forest-canopy/15",
    "bg-pale-stone",
    "bg-warm-parchment",
  ];
  return palette[Math.abs(seed) % palette.length];
}

export function ProductCard({
  product,
  farmerName,
  farmerRating,
  href,
  showStatus = false,
}: Props) {
  const link = href ?? `/products/${product.id}`;
  const days = daysUntil(product.expiry_date);

  return (
    <Link
      href={link}
      className="group flex flex-col overflow-hidden rounded-2xl border border-forest-canopy/15 bg-warm-parchment transition-opacity hover:opacity-95"
    >
      <div className={`relative aspect-[4/3] w-full ${placeholderBg(product.id)}`}>
        {product.image_path ? (
          <Image
            src={product.image_path}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
            unoptimized={product.image_path.startsWith("data:")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-forest-canopy/55">
              No photo
            </span>
            <span className="line-clamp-2 text-body-sm font-medium text-forest-canopy/80">
              {product.name}
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {showStatus ? <ListingStatusBadge status={product.status} /> : null}
          {product.status === "active" ? <FreshnessBadge days={days} /> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-body font-medium tracking-[-0.4px] line-clamp-2">
          {product.name}
        </h3>
        <p className="text-body-lg font-medium tracking-[-0.36px]">
          {formatNaira(product.price)}
          <span className="text-body-sm font-normal text-forest-canopy/70">
            {" "}
            / {product.unit}
          </span>
        </p>
        <p className="text-body-sm text-forest-canopy/70">
          {product.lga} · Qty {product.quantity}
        </p>
        {farmerName ? (
          <p className="mt-auto pt-2 text-body-sm text-forest-canopy/80">
            {farmerName}
            {farmerRating != null && farmerRating > 0 ? (
              <>
                {" "}
                · <StarRating value={farmerRating} />
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
