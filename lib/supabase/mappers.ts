/**
 * Map Supabase rows ↔ domain types.
 */
import type {
  Category,
  ContactRequest,
  PriceHistory,
  Product,
  Review,
  TransportProvider,
  User,
  UserRole,
  VerificationStatus,
} from "@/lib/types";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  lga: string;
  role: UserRole;
  verification_status: VerificationStatus;
  average_rating: number | string;
  review_count: number;
  created_at: string;
  last_login: string | null;
};

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    lga: row.lga,
    role: row.role,
    verification_status: row.verification_status,
    password_hash: "",
    password_salt: "",
    average_rating: Number(row.average_rating) || 0,
    review_count: row.review_count ?? 0,
    created_at: row.created_at,
    last_login: row.last_login,
  };
}

type ProductRow = {
  id: number;
  farmer_id: string;
  category_id: number;
  name: string;
  description: string | null;
  price: number | string;
  unit: string;
  quantity: number | string;
  expiry_date: string;
  status: Product["status"];
  image_path: string | null;
  lga: string;
  created_at: string;
  updated_at: string;
};

export function mapProduct(row: ProductRow): Product {
  return {
    id: Number(row.id),
    farmer_id: row.farmer_id,
    category_id: Number(row.category_id),
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    unit: row.unit,
    quantity: Number(row.quantity),
    expiry_date: row.expiry_date,
    status: row.status,
    image_path: row.image_path,
    lga: row.lga,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapCategory(row: {
  id: number;
  name: string;
  icon: string | null;
  slug: string;
}): Category {
  return {
    id: Number(row.id),
    name: row.name,
    icon: row.icon ?? "",
    slug: row.slug,
  };
}

export function mapContact(row: {
  id: number;
  buyer_id: string;
  farmer_id: string;
  product_id: number;
  method: ContactRequest["method"];
  status: ContactRequest["status"];
  created_at: string;
}): ContactRequest {
  return {
    id: Number(row.id),
    buyer_id: row.buyer_id,
    farmer_id: row.farmer_id,
    product_id: Number(row.product_id),
    method: row.method,
    status: row.status,
    created_at: row.created_at,
  };
}

export function mapReview(row: {
  id: number;
  buyer_id: string;
  farmer_id: string;
  product_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}): Review {
  return {
    id: Number(row.id),
    buyer_id: row.buyer_id,
    farmer_id: row.farmer_id,
    product_id: Number(row.product_id),
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
  };
}

export function mapPriceHistory(row: {
  id: number;
  category_id: number;
  avg_price: number | string;
  recorded_on: string;
}): PriceHistory {
  return {
    id: Number(row.id),
    category_id: Number(row.category_id),
    avg_price: Number(row.avg_price),
    recorded_on: row.recorded_on,
  };
}

export function mapTransport(row: {
  id: number;
  name: string;
  phone: string;
  coverage_lga: string | null;
  notes: string | null;
}): TransportProvider {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    coverage_lga: row.coverage_lga,
    notes: row.notes,
  };
}
