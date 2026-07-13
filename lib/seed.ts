/**
 * One-time localStorage bootstrap (Part A).
 * Seeds taxonomy only — NO demo users, listings, contacts, or reviews.
 * Users register and sign in themselves to list or contact sellers.
 *
 * Seed flag v2 invalidates older demo-heavy seeds so browsers pick up a clean store.
 */

import { SEED_FLAG_KEY, STORAGE_NAMESPACE } from "@/lib/config";
import {
  categoryRepository,
  transportProviderRepository,
} from "@/lib/repositories";
import { clearAllTables } from "@/lib/repositories/reset";
import type { Category, TransportProvider } from "@/lib/types";

/** Bump when seed contents change so existing browsers re-bootstrap cleanly */
const SEED_VERSION = "v3-icons";
const VERSIONED_SEED_FLAG = `${SEED_FLAG_KEY}:${SEED_VERSION}`;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function alreadySeeded(): boolean {
  if (!isBrowser()) return true;
  return window.localStorage.getItem(VERSIONED_SEED_FLAG) === "1";
}

function markSeeded(): void {
  if (!isBrowser()) return;
  // Clear legacy seed flag
  window.localStorage.removeItem(SEED_FLAG_KEY);
  window.localStorage.setItem(VERSIONED_SEED_FLAG, "1");
}

/** icon stores lucide key / slug — rendered via CategoryIcon, never emoji */
const CATEGORIES: Omit<Category, "id">[] = [
  { name: "Maize", icon: "maize", slug: "maize" },
  { name: "Sorghum", icon: "sorghum", slug: "sorghum" },
  { name: "Millet", icon: "millet", slug: "millet" },
  { name: "Groundnuts", icon: "groundnuts", slug: "groundnuts" },
  { name: "Livestock", icon: "livestock", slug: "livestock" },
  { name: "Poultry", icon: "poultry", slug: "poultry" },
  { name: "Dairy", icon: "dairy", slug: "dairy" },
  { name: "Vegetables", icon: "vegetables", slug: "vegetables" },
];

/** Optional logistics directory — not marketplace listings */
const TRANSPORT: Omit<TransportProvider, "id">[] = [
  {
    name: "Biu Express Logistics",
    phone: "08051234567",
    coverage_lga: "Biu, Hawul, Kwaya Kusar",
    notes: "Pick-up from farm gate. Bags and crates.",
  },
  {
    name: "Sahel Haulage Co.",
    phone: "08059876543",
    coverage_lga: "Maiduguri, Jere, Konduga",
    notes: "Livestock trailers available on request.",
  },
  {
    name: "Green Corridor Transporters",
    phone: "08055551234",
    coverage_lga: "Biu, Shani, Bayo, Askira/Uba",
    notes: "Same-day Biu market runs. Call before 7am.",
  },
];

export type SeedResult = {
  seeded: boolean;
  message: string;
  counts?: Record<string, number>;
};

/**
 * Wipe all marketplace tables and re-seed categories (+ logistics directory).
 * Call with force=true to clear users/listings after a previous demo seed.
 */
export async function runSeed(force = false): Promise<SeedResult> {
  if (!isBrowser()) {
    return { seeded: false, message: "Seed runs only in the browser" };
  }

  const cats = await categoryRepository.findAll();
  if (!force && alreadySeeded() && cats.length > 0) {
    return {
      seeded: false,
      message:
        "Bootstrap already applied (categories only — no demo listings)",
      counts: { categories: cats.length },
    };
  }

  // Always clear transactional data on first v2 bootstrap or force
  await clearAllTables();
  window.localStorage.removeItem(SEED_FLAG_KEY);
  // Drop any leftover session so old demo logins don't stick
  window.localStorage.removeItem(`${STORAGE_NAMESPACE}:session`);

  for (let i = 0; i < CATEGORIES.length; i++) {
    await categoryRepository.create({ id: i + 1, ...CATEGORIES[i] });
  }

  for (let i = 0; i < TRANSPORT.length; i++) {
    await transportProviderRepository.create({
      id: i + 1,
      ...TRANSPORT[i],
    });
  }

  markSeeded();

  return {
    seeded: true,
    message:
      "Clean marketplace ready — register an account to list or contact sellers",
    counts: {
      categories: CATEGORIES.length,
      transport_providers: TRANSPORT.length,
      users: 0,
      products: 0,
    },
  };
}

export async function ensureSeeded(): Promise<SeedResult> {
  return runSeed(false);
}

/** Dev helper: wipe everything and re-bootstrap taxonomy */
export async function resetMarketplace(): Promise<SeedResult> {
  return runSeed(true);
}
