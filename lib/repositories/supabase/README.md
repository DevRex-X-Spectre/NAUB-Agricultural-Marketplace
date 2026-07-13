# Supabase repository implementations (Part B5)

When `NEXT_PUBLIC_DATA_SOURCE=supabase`, `lib/repositories/index.ts` exports these classes instead of localStorage repos.

| Local class | Supabase class | Table |
|---|---|---|
| `UserRepository` | `SupabaseUserRepository` | `profiles` |
| `ProductRepository` | `SupabaseProductRepository` | `products` |
| `CategoryRepository` | `SupabaseCategoryRepository` | `categories` |
| `ContactRequestRepository` | `SupabaseContactRequestRepository` | `contact_requests` |
| `ReviewRepository` | `SupabaseReviewRepository` | `reviews` |
| `PriceHistoryRepository` | `SupabasePriceHistoryRepository` | `price_history` |
| `TransportProviderRepository` | `SupabaseTransportProviderRepository` | `transport_providers` |

**Method signatures are identical.** Services and UI are not modified for the swap.

## Auth

`AuthService` uses Supabase Auth (`signUp` / `signInWithPassword` / `signOut`) when `DATA_SOURCE=supabase`.  
Phone-first UX maps to synthetic emails: `{digits}@phone.naub-agri.local`.

## Storage

Listing photos: `lib/supabase/storage.ts` → bucket `product-images`.

## Never ship service role

Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the browser. Service role is for CLI seed scripts only.
