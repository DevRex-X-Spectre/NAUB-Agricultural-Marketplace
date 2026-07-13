/**
 * Repository barrel — switches implementation by DATA_SOURCE.
 * UI and services always import from here; never import storage-engine or supabase clients directly.
 */

import { DATA_SOURCE } from "@/lib/config";
import {
  CategoryRepository,
  categoryRepository as localCategoryRepository,
} from "./category-repository";
import {
  ContactRequestRepository,
  contactRequestRepository as localContactRequestRepository,
} from "./contact-request-repository";
import {
  PriceHistoryRepository,
  priceHistoryRepository as localPriceHistoryRepository,
} from "./price-history-repository";
import {
  ProductRepository,
  productRepository as localProductRepository,
} from "./product-repository";
import {
  ReviewRepository,
  reviewRepository as localReviewRepository,
} from "./review-repository";
import {
  TransportProviderRepository,
  transportProviderRepository as localTransportProviderRepository,
} from "./transport-provider-repository";
import {
  UserRepository,
  userRepository as localUserRepository,
} from "./user-repository";
import { SupabaseCategoryRepository } from "./supabase/category-repository";
import { SupabaseContactRequestRepository } from "./supabase/contact-request-repository";
import { SupabasePriceHistoryRepository } from "./supabase/price-history-repository";
import { SupabaseProductRepository } from "./supabase/product-repository";
import { SupabaseReviewRepository } from "./supabase/review-repository";
import { SupabaseTransportProviderRepository } from "./supabase/transport-provider-repository";
import { SupabaseUserRepository } from "./supabase/user-repository";

export type { Repository } from "./types";
export { UserRepository, CategoryRepository, ProductRepository };
export {
  ContactRequestRepository,
  ReviewRepository,
  PriceHistoryRepository,
  TransportProviderRepository,
};

const useSupabase = DATA_SOURCE === "supabase";

export const userRepository = useSupabase
  ? new SupabaseUserRepository()
  : localUserRepository;

export const categoryRepository = useSupabase
  ? new SupabaseCategoryRepository()
  : localCategoryRepository;

export const productRepository = useSupabase
  ? new SupabaseProductRepository()
  : localProductRepository;

export const contactRequestRepository = useSupabase
  ? new SupabaseContactRequestRepository()
  : localContactRequestRepository;

export const reviewRepository = useSupabase
  ? new SupabaseReviewRepository()
  : localReviewRepository;

export const priceHistoryRepository = useSupabase
  ? new SupabasePriceHistoryRepository()
  : localPriceHistoryRepository;

export const transportProviderRepository = useSupabase
  ? new SupabaseTransportProviderRepository()
  : localTransportProviderRepository;
