/**
 * Domain types — field-for-field mirror of thesis §3.8 (Tables 3.4–3.7)
 * plus categories, price_history, and transport_providers for FR-10 / §1.4.
 *
 * Part A (local): user ids are numbers.
 * Part B (Supabase): user ids are UUID strings.
 * Product/category/etc. rows stay numeric in both.
 */

// ─── IDs ─────────────────────────────────────────────────────────────────────

/** Local auto-increment number OR Supabase auth UUID */
export type UserId = number | string;

export function sameId(a: UserId, b: UserId): boolean {
  return String(a) === String(b);
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = "farmer" | "buyer" | "admin";

export type VerificationStatus =
  | "pending"
  | "verified"
  | "suspended"
  | "banned";

export const VERIFICATION_STATUS_CODE: Record<VerificationStatus, number> = {
  pending: 0,
  verified: 1,
  suspended: 2,
  banned: 3,
};

export type ListingStatus = "active" | "sold" | "expired" | "flagged";
export type ContactMethod = "whatsapp" | "call";
export type RequestStatus = "sent" | "completed";

// ─── Service response ────────────────────────────────────────────────────────

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: UserId;
  full_name: string;
  phone: string;
  email: string | null;
  lga: string;
  role: UserRole;
  verification_status: VerificationStatus;
  /**
   * Local only. Empty when DATA_SOURCE=supabase (Auth owns passwords).
   * SWAP: never trust client hashes in production — Supabase Auth handles bcrypt.
   */
  password_hash: string;
  password_salt: string;
  average_rating: number;
  review_count: number;
  created_at: string;
  last_login: string | null;
}

export type PublicUser = Omit<User, "password_hash" | "password_salt">;

export interface Category {
  id: number;
  name: string;
  /** Lucide key/slug for CategoryIcon — never emoji */
  icon: string;
  slug: string;
}

export interface Product {
  id: number;
  farmer_id: UserId;
  category_id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  expiry_date: string;
  status: ListingStatus;
  /** Local path, data URL, or Supabase Storage public URL */
  image_path: string | null;
  lga: string;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: number;
  buyer_id: UserId;
  farmer_id: UserId;
  product_id: number;
  method: ContactMethod;
  status: RequestStatus;
  created_at: string;
}

export interface Review {
  id: number;
  buyer_id: UserId;
  farmer_id: UserId;
  product_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PriceHistory {
  id: number;
  category_id: number;
  avg_price: number;
  recorded_on: string;
}

export interface TransportProvider {
  id: number;
  name: string;
  phone: string;
  coverage_lga: string | null;
  notes: string | null;
}

export interface Session {
  token: string;
  user_id: UserId;
  role: UserRole;
  issued_at: string;
  expires_at: string;
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

export type CreateUserInput = {
  full_name: string;
  phone: string;
  email?: string | null;
  lga: string;
  role: Exclude<UserRole, "admin">;
  password: string;
};

export type CreateProductInput = {
  farmer_id: UserId;
  category_id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  expiry_date: string;
  image_path?: string | null;
  lga: string;
};

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, "farmer_id">
> & { status?: ListingStatus };

export type CreateContactRequestInput = {
  buyer_id: UserId;
  farmer_id: UserId;
  product_id: number;
  method: ContactMethod;
};

export type CreateReviewInput = {
  buyer_id: UserId;
  farmer_id: UserId;
  product_id: number;
  rating: number;
  comment?: string | null;
};

export type ProductFilter = {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  lga?: string;
  max_days_to_expiry?: number;
  status?: ListingStatus;
  farmer_id?: UserId;
  search?: string;
};

export type AdminDashboardStats = {
  total_users: number;
  farmers: number;
  buyers: number;
  pending_verifications: number;
  active_listings: number;
  flagged_listings: number;
  contact_requests: number;
  reviews: number;
};
