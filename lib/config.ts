/**
 * Application configuration.
 * DATA_SOURCE is the single switch for backend migration (Phase 8 / Part B).
 * Prefer env NEXT_PUBLIC_DATA_SOURCE so deploy can flip without rebuild of logic.
 */
export type DataSource = "local" | "api" | "supabase";

function resolveDataSource(): DataSource {
  const fromEnv = process.env.NEXT_PUBLIC_DATA_SOURCE;
  if (fromEnv === "supabase" || fromEnv === "api" || fromEnv === "local") {
    return fromEnv;
  }
  return "local";
}

export const DATA_SOURCE: DataSource = resolveDataSource();

export const isSupabase = DATA_SOURCE === "supabase";
export const isLocal = DATA_SOURCE === "local";

/** localStorage key namespace for all tables */
export const STORAGE_NAMESPACE = "naub_agri";

/** Session storage key for the current auth session (local mode) */
export const SESSION_KEY = `${STORAGE_NAMESPACE}:session`;

/** Seed-run flag — prevents duplicate seeding */
export const SEED_FLAG_KEY = `${STORAGE_NAMESPACE}:seeded`;

/** Supabase public env (safe for browser) */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Product images bucket (B4 — Supabase fallback when Cloudinary is off) */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * Cloudinary (primary listing photo backend).
 * Create an unsigned upload preset in Cloudinary Dashboard → Settings → Upload.
 */
export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";


/**
 * Default admin phone(s) from env — changeable without code edits.
 * Set NEXT_PUBLIC_ADMIN_PHONE to one number, or comma-separated for several:
 *   NEXT_PUBLIC_ADMIN_PHONE=08010000001
 *   NEXT_PUBLIC_ADMIN_PHONE=08010000001,08020000002
 * Must be NEXT_PUBLIC_* so client-side AuthService can apply on register/login.
 */
export const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "";

/** Digits-only form of a Nigerian/local phone for comparison */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}

/** Phones configured as marketplace admins */
export function getAdminPhones(): string[] {
  if (!ADMIN_PHONE.trim()) return [];
  return ADMIN_PHONE.split(",")
    .map((p) => normalizePhone(p.trim()))
    .filter(Boolean);
}

/** True if this phone should receive the admin role */
export function isConfiguredAdminPhone(phone: string): boolean {
  const n = normalizePhone(phone);
  if (!n) return false;
  return getAdminPhones().some((admin) => admin === n);
}

export function assertSupabaseConfigured(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
}

/**
 * LGAs relevant to the NAUB / Biu corridor (Borno State focus + nearby trade hubs).
 */
export const LGA_OPTIONS = [
  "Biu",
  "Hawul",
  "Kwaya Kusar",
  "Bayo",
  "Shani",
  "Askira/Uba",
  "Chibok",
  "Damboa",
  "Maiduguri",
  "Jere",
  "Konduga",
  "Gwoza",
  "Other",
] as const;

export type LgaOption = (typeof LGA_OPTIONS)[number];
