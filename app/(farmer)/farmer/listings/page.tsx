"use client";

import { ProductCard } from "@/components/marketplace/product-card";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { productService } from "@/lib/services";
import type { ListingStatus, Product } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const FILTERS: { value: ListingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "expired", label: "Expired" },
  { value: "flagged", label: "Flagged" },
];

export default function FarmerListingsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ListingStatus | "all">("all");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await productService.archiveExpiredListings();
      const res = await productService.listByFarmer(
        user.id,
        filter === "all" ? undefined : filter
      );
      setProducts(res.data ?? []);
    })();
  }, [user, filter]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            Inventory
          </h1>
          <p className="text-body-sm text-forest-canopy/70">
            Manage active, sold, expired, and flagged listings
          </p>
        </div>
        <Link href="/farmer/listings/new">
          <Button className="w-full sm:w-auto">New listing</Button>
        </Link>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={[
              "min-h-11 shrink-0 rounded-full px-4 text-body-sm font-medium",
              filter === f.value
                ? "bg-forest-canopy text-warm-parchment"
                : "bg-pale-stone text-forest-canopy",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-body text-forest-canopy/70">
          No listings in this filter.{" "}
          <Link href="/farmer/listings/new" className="underline">
            Create one
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showStatus
              href={`/farmer/listings/${p.id}/edit`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
