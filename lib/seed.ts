/**
 * One-time localStorage bootstrap (Part A).
 * Categories + logistics + demo farmers/buyers + sample product listings
 * so the catalogue is not empty for demos and defense.
 *
 * Demo password for all seed accounts: password123
 * Seed flag version bumps re-run this when content changes.
 */

import {
  ADMIN_PHONE,
  SEED_FLAG_KEY,
  STORAGE_NAMESPACE,
  isConfiguredAdminPhone,
  normalizePhone,
} from "@/lib/config";
import {
  categoryRepository,
  productRepository,
  transportProviderRepository,
  userRepository,
} from "@/lib/repositories";
import { clearAllTables } from "@/lib/repositories/reset";
import type { Category, Product, TransportProvider, User } from "@/lib/types";
import { hashPassword } from "@/lib/utils/password";

const SEED_VERSION = "v4-demo-products";
const VERSIONED_SEED_FLAG = `${SEED_FLAG_KEY}:${SEED_VERSION}`;

/** Shared demo password — document in README / login hint if needed */
export const DEMO_PASSWORD = "password123";

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
  window.localStorage.removeItem(SEED_FLAG_KEY);
  // Clear older version flags so we only track current
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith(`${SEED_FLAG_KEY}:`) && key !== VERSIONED_SEED_FLAG) {
      window.localStorage.removeItem(key);
    }
  }
  window.localStorage.setItem(VERSIONED_SEED_FLAG, "1");
}

function daysFromNow(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
}

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

export async function runSeed(force = false): Promise<SeedResult> {
  if (!isBrowser()) {
    return { seeded: false, message: "Seed runs only in the browser" };
  }

  const existingProducts = await productRepository.findAll();
  if (!force && alreadySeeded() && existingProducts.length > 0) {
    return {
      seeded: false,
      message: "Demo marketplace already loaded",
      counts: {
        products: existingProducts.length,
        categories: (await categoryRepository.findAll()).length,
      },
    };
  }

  // Also re-seed if flag set but products empty (partial state)
  if (!force && alreadySeeded() && existingProducts.length === 0) {
    // fall through to re-seed
  } else if (!force && alreadySeeded()) {
    return {
      seeded: false,
      message: "Already seeded",
      counts: { products: existingProducts.length },
    };
  }

  await clearAllTables();
  window.localStorage.removeItem(SEED_FLAG_KEY);
  window.localStorage.removeItem(`${STORAGE_NAMESPACE}:session`);

  const { hash, salt } = await hashPassword(DEMO_PASSWORD);
  const now = new Date().toISOString();

  // Categories
  const categories: Category[] = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    categories.push(
      await categoryRepository.create({ id: i + 1, ...CATEGORIES[i] })
    );
  }
  const bySlug = (slug: string) =>
    categories.find((c) => c.slug === slug)!.id;

  // Users — admin from env if set, plus demo farmers & buyer
  const adminPhone =
    normalizePhone(ADMIN_PHONE.split(",")[0]?.trim() || "") || "08010000001";

  type UserSpec = Omit<User, "id" | "password_hash" | "password_salt"> & {
    id: number;
  };

  const usersSpec: UserSpec[] = [
    {
      id: 1,
      full_name: "Admin NAUB",
      phone: adminPhone,
      email: "admin@naub-agri.local",
      lga: "Biu",
      role: "admin",
      verification_status: "verified",
      average_rating: 0,
      review_count: 0,
      created_at: now,
      last_login: null,
    },
    {
      id: 2,
      full_name: "Musa Ibrahim",
      phone: "08031112222",
      email: null,
      lga: "Biu",
      role: "farmer",
      verification_status: "verified",
      average_rating: 4.5,
      review_count: 0,
      created_at: now,
      last_login: null,
    },
    {
      id: 3,
      full_name: "Aisha Bello",
      phone: "08033334444",
      email: null,
      lga: "Hawul",
      role: "farmer",
      verification_status: "verified",
      average_rating: 4.0,
      review_count: 0,
      created_at: now,
      last_login: null,
    },
    {
      id: 4,
      full_name: "Fatima Sani",
      phone: "08037778888",
      email: null,
      lga: "Maiduguri",
      role: "buyer",
      verification_status: "verified",
      average_rating: 0,
      review_count: 0,
      created_at: now,
      last_login: null,
    },
  ];

  // If a demo farmer phone equals admin phone, force admin role on that row only once
  for (const u of usersSpec) {
    if (isConfiguredAdminPhone(u.phone) && u.role !== "admin") {
      u.role = "admin";
      u.verification_status = "verified";
    }
    await userRepository.create({
      ...u,
      password_hash: hash,
      password_salt: salt,
    });
  }

  const products: Omit<Product, "id">[] = [
    {
      farmer_id: 2,
      category_id: bySlug("maize"),
      name: "White Maize — 50kg bags",
      description:
        "Dry white maize from Biu farms. Clean, ready for mill. Minimum 5 bags.",
      price: 28000,
      unit: "bag",
      quantity: 40,
      expiry_date: daysFromNow(45),
      status: "active",
      image_path: "/demo-images/maize/1.jpg",
      lga: "Biu",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 2,
      category_id: bySlug("groundnuts"),
      name: "Shelled Groundnuts",
      description: "Grade A shelled groundnuts, sun-dried. Ideal for oil mills.",
      price: 15000,
      unit: "mudu",
      quantity: 80,
      expiry_date: daysFromNow(60),
      status: "active",
      image_path: "/demo-images/groundnuts/1.jpg",
      lga: "Biu",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 3,
      category_id: bySlug("sorghum"),
      name: "Red Sorghum Grain",
      description:
        "Freshly harvested red sorghum. Good for animal feed and brewing.",
      price: 22000,
      unit: "bag",
      quantity: 25,
      expiry_date: daysFromNow(30),
      status: "active",
      image_path: "/demo-images/sorghum/1.jpg",
      lga: "Hawul",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 3,
      category_id: bySlug("poultry"),
      name: "Live Broilers (8 weeks)",
      description: "Healthy broilers ready for market. Sold per bird.",
      price: 4500,
      unit: "bird",
      quantity: 60,
      expiry_date: daysFromNow(7),
      status: "active",
      image_path: "/demo-images/poultry/1.jpg",
      lga: "Hawul",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 2,
      category_id: bySlug("livestock"),
      name: "Sokoto Red Goats",
      description: "Healthy goats, vaccinated. Suitable for breeding or meat.",
      price: 45000,
      unit: "head",
      quantity: 8,
      expiry_date: daysFromNow(90),
      status: "active",
      image_path: "/demo-images/goats/1.jpg",
      lga: "Biu",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 3,
      category_id: bySlug("vegetables"),
      name: "Fresh Tomatoes — crates",
      description:
        "Ripe tomatoes from Hawul gardens. Best collected same day.",
      price: 12000,
      unit: "crate",
      quantity: 15,
      expiry_date: daysFromNow(3),
      status: "active",
      image_path: "/demo-images/tomatoes/1.jpg",
      lga: "Hawul",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 2,
      category_id: bySlug("dairy"),
      name: "Fresh Cow Milk",
      description: "Morning-milked fresh milk. Bring own containers.",
      price: 800,
      unit: "litre",
      quantity: 40,
      expiry_date: daysFromNow(1),
      status: "active",
      image_path: "/demo-images/dairy/1.jpg",
      lga: "Biu",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 3,
      category_id: bySlug("vegetables"),
      name: "Hot Peppers (shombo)",
      description: "Fresh hot peppers, sorted. Ideal for market traders.",
      price: 5000,
      unit: "basket",
      quantity: 20,
      expiry_date: daysFromNow(5),
      status: "active",
      image_path: "/demo-images/peppers/1.jpg",
      lga: "Hawul",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 2,
      category_id: bySlug("millet"),
      name: "Pearl Millet Grain",
      description: "Clean pearl millet for household and commercial use.",
      price: 18000,
      unit: "bag",
      quantity: 12,
      expiry_date: daysFromNow(40),
      status: "active",
      image_path: "/demo-images/millet/1.jpg",
      lga: "Biu",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 3,
      category_id: bySlug("livestock"),
      name: "White Fulani Cattle (steer)",
      description:
        "Well-fed steer, good condition. Inspection welcome at farm.",
      price: 280000,
      unit: "head",
      quantity: 2,
      expiry_date: daysFromNow(120),
      status: "active",
      image_path: "/demo-images/cattle/1.jpg",
      lga: "Hawul",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 2,
      category_id: bySlug("maize"),
      name: "Yellow Maize — bulk bags",
      description: "Yellow maize suitable for feed mills. Discount on 20+ bags.",
      price: 26500,
      unit: "bag",
      quantity: 30,
      expiry_date: daysFromNow(50),
      status: "active",
      image_path: "/demo-images/maize/2.jpg",
      lga: "Biu",
      created_at: now,
      updated_at: now,
    },
    {
      farmer_id: 3,
      category_id: bySlug("vegetables"),
      name: "Leafy greens — mixed bundles",
      description: "Fresh garden greens. Morning harvest only.",
      price: 1500,
      unit: "bundle",
      quantity: 50,
      expiry_date: daysFromNow(2),
      status: "active",
      image_path: "/demo-images/vegetables/1.jpg",
      lga: "Hawul",
      created_at: now,
      updated_at: now,
    },
  ];

  for (let i = 0; i < products.length; i++) {
    await productRepository.create({ id: i + 1, ...products[i] });
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
    message: `Demo marketplace loaded — ${products.length} listings (password: ${DEMO_PASSWORD})`,
    counts: {
      categories: categories.length,
      users: usersSpec.length,
      products: products.length,
      transport_providers: TRANSPORT.length,
    },
  };
}

export async function ensureSeeded(): Promise<SeedResult> {
  return runSeed(false);
}

/** Wipe and re-seed demo data */
export async function resetMarketplace(): Promise<SeedResult> {
  return runSeed(true);
}
