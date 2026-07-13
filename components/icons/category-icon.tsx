import {
  Bean,
  Bird,
  Carrot,
  Leaf,
  type LucideIcon,
  type LucideProps,
  Milk,
  Sprout,
  Wheat,
  Beef,
} from "lucide-react";

/**
 * Maps category slug / icon key → Lucide icon (no emoji).
 */
const BY_SLUG: Record<string, LucideIcon> = {
  maize: Wheat,
  sorghum: Wheat,
  millet: Sprout,
  groundnuts: Bean,
  livestock: Beef,
  poultry: Bird,
  dairy: Milk,
  vegetables: Carrot,
  leaf: Leaf,
};

export function CategoryIcon({
  slug,
  iconKey,
  className = "h-5 w-5",
  ...props
}: {
  slug?: string;
  /** Stored Category.icon — prefers lucide key, falls back to slug */
  iconKey?: string | null;
} & LucideProps) {
  const key = (iconKey || slug || "").toLowerCase().replace(/[^a-z]/g, "");
  const Icon =
    BY_SLUG[key] ||
    BY_SLUG[slug?.toLowerCase() ?? ""] ||
    Leaf;
  return <Icon className={className} strokeWidth={1.75} aria-hidden {...props} />;
}

export function categoryIconKey(slug: string): string {
  return slug;
}
