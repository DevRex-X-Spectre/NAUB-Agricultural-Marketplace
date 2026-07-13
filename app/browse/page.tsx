"use client";

import { CategoryIcon } from "@/components/icons/category-icon";
import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/marketplace/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LGA_OPTIONS } from "@/lib/config";
import { categoryRepository, userRepository } from "@/lib/repositories";
import { productService } from "@/lib/services";
import type { Category, Product } from "@/lib/types";
import {
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function BrowsePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmerNames, setFarmerNames] = useState<Record<string, string>>({});
  const [farmerRatings, setFarmerRatings] = useState<Record<string, number>>(
    {}
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lga, setLga] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [freshness, setFreshness] = useState("");

  useEffect(() => {
    categoryRepository.findAll().then(setCategories);
  }, []);

  const filterKey = useMemo(
    () =>
      [search, categoryId, lga, minPrice, maxPrice, freshness].join("|"),
    [search, categoryId, lga, minPrice, maxPrice, freshness]
  );

  const activeFilterCount = [
    categoryId,
    lga,
    minPrice,
    maxPrice,
    freshness,
  ].filter(Boolean).length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await productService.filterCatalogue({
        search: search.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        lga: lga || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        max_days_to_expiry: freshness ? Number(freshness) : undefined,
      });
      if (cancelled) return;
      const list = res.data ?? [];
      setProducts(list);

      const farmerIds = [...new Set(list.map((p) => p.farmer_id))];
      const names: Record<string, string> = {};
      const ratings: Record<string, number> = {};
      for (const fid of farmerIds) {
        const u = await userRepository.findById(fid);
        if (u) {
          names[String(fid)] = u.full_name;
          ratings[String(fid)] = u.average_rating;
        }
      }
      if (!cancelled) {
        setFarmerNames(names);
        setFarmerRatings(ratings);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  function clearFilters() {
    setCategoryId("");
    setLga("");
    setMinPrice("");
    setMaxPrice("");
    setFreshness("");
    setSearch("");
  }

  /** Sidebar-friendly filter stack (single column on desktop left rail) */
  const filterPanel = (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-body-sm font-medium">Category</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button
            type="button"
            onClick={() => setCategoryId("")}
            className={[
              "flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-body-sm font-medium transition-colors lg:justify-start",
              !categoryId
                ? "border-forest-canopy bg-forest-canopy text-warm-parchment"
                : "border-forest-canopy/15 bg-warm-parchment text-forest-canopy hover:bg-pale-stone",
            ].join(" ")}
          >
            All categories
          </button>
          {categories.map((c) => {
            const selected = categoryId === String(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(selected ? "" : String(c.id))}
                className={[
                  "flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-body-sm transition-colors",
                  selected
                    ? "border-forest-canopy bg-lime-sprout text-forest-canopy"
                    : "border-forest-canopy/15 bg-warm-parchment text-forest-canopy hover:bg-pale-stone",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    selected ? "bg-warm-parchment/80" : "bg-pale-stone",
                  ].join(" ")}
                >
                  <CategoryIcon
                    slug={c.slug}
                    iconKey={c.icon}
                    className="h-4 w-4"
                  />
                </span>
                <span className="font-medium leading-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Select
          label="Local Government Area"
          value={lga}
          onChange={(e) => setLga(e.target.value)}
          placeholder="Any LGA"
          options={LGA_OPTIONS.map((x) => ({ value: x, label: x }))}
        />
        <Select
          label="Freshness"
          value={freshness}
          onChange={(e) => setFreshness(e.target.value)}
          placeholder="Any freshness"
          options={[
            { value: "3", label: "Expires within 3 days" },
            { value: "7", label: "Within 7 days" },
            { value: "14", label: "Within 14 days" },
            { value: "30", label: "Within 30 days" },
          ]}
        />
        <Input
          label="Min price (NGN)"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <Input
          label="Max price (NGN)"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Any"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {activeFilterCount > 0 || search ? (
        <Button
          variant="ghost"
          type="button"
          className="w-full gap-2"
          onClick={clearFilters}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Clear all filters
        </Button>
      ) : null}
    </div>
  );

  const productGrid = loading ? (
    <p className="text-body text-forest-canopy/70">Loading…</p>
  ) : products.length === 0 ? (
    <div className="rounded-3xl border border-forest-canopy/10 bg-pale-stone px-5 py-10 text-center">
      <p className="text-body text-forest-canopy/80">
        No listings match these filters.
      </p>
      <Button
        variant="secondary"
        className="mt-4 gap-2"
        onClick={clearFilters}
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        Reset filters
      </Button>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          farmerName={farmerNames[String(p.farmer_id)]}
          farmerRating={farmerRatings[String(p.farmer_id)]}
        />
      ))}
    </div>
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Page header + search (full width) */}
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-heading font-light tracking-tight">
                Market catalogue
              </h1>
              <p className="mt-1 text-body-sm text-forest-canopy/70">
                {loading
                  ? "Loading listings…"
                  : `${products.length} active listing${products.length === 1 ? "" : "s"}`}
                {activeFilterCount > 0
                  ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <Button
              variant="secondary"
              className="shrink-0 gap-2 lg:hidden"
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-canopy px-1.5 text-[11px] font-medium text-warm-parchment">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>

          <label className="relative block w-full">
            <span className="sr-only">Search listings</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-canopy/45"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search maize, tomatoes, goats…"
              className="w-full min-h-11 rounded-full border border-forest-canopy/20 bg-warm-parchment py-3 pl-10 pr-10 text-body text-forest-canopy placeholder:text-soft-sage"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-forest-canopy/60 hover:bg-pale-stone"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </header>

        {/* Desktop: filters left · products fill remaining space */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="hidden w-full shrink-0 lg:block lg:w-[280px] xl:w-[300px]">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-forest-canopy/10 bg-pale-stone/70 p-5">
              <div className="mb-4 flex items-center gap-2 text-body-sm font-medium">
                <Filter className="h-4 w-4" aria-hidden />
                Filters
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">{productGrid}</div>
        </div>

        {/* Mobile / tablet filter sheet */}
        {filtersOpen ? (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-true-black/40 lg:hidden"
            role="dialog"
            aria-modal
            aria-label="Filters"
          >
            <button
              type="button"
              className="flex-1"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="max-h-[88vh] overflow-y-auto rounded-t-3xl bg-warm-parchment p-5 pb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-subheading font-light">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden />
                  Filters
                </h2>
                <Button
                  variant="secondary"
                  className="!py-2 gap-1"
                  onClick={() => setFiltersOpen(false)}
                >
                  Done
                </Button>
              </div>
              {filterPanel}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
