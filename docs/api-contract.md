# Phase 8 — Repository / Service API Contract (frozen)

This document freezes the contract Part B (Supabase) must implement.  
**UI and services must not change** when repositories swap internals.

`DATA_SOURCE` via `NEXT_PUBLIC_DATA_SOURCE` / `lib/config.ts`: `'local' | 'api' | 'supabase'`.

**User ids:** `UserId = number | string` (local auto-increment vs Supabase UUID). Compare with `sameId()`.

## Response shape (all services)

```ts
type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## Shared `Repository<T>`

| Method | Signature | Supabase mapping |
|---|---|---|
| `findAll` | `() => Promise<T[]>` | `.from(table).select('*')` |
| `findById` | `(id) => Promise<T \| null>` | `.select().eq('id', id).maybeSingle()` |
| `create` | `(data) => Promise<T>` | `.insert(data).select().single()` |
| `update` | `(id, patch) => Promise<T \| null>` | `.update(patch).eq('id', id).select().single()` |
| `delete` | `(id) => Promise<boolean>` | `.delete().eq('id', id)` |

> Part A uses numeric `id`. Part B `profiles` use UUID from `auth.users`.  
> Services that take `farmer_id` / `user_id` must accept the Part B id type after the swap (prefer string | number union or migrate Part A to string UUIDs in B5).  
> **Frozen for Part A:** number ids. Part B adapters may map UUID ↔ opaque string in repository layer without changing method *names*.

## UserRepository

| Method | Filters / notes |
|---|---|
| `findByPhone(phone)` | eq phone (normalized) |
| `findByRole(role)` | eq role |
| `findByVerificationStatus(status)` | eq verification_status |

## ProductRepository

| Method | Filters |
|---|---|
| `findByFarmerId(farmerId)` | eq farmer_id |
| `findActiveByCategory(categoryId)` | eq category_id, status=active |
| `findByStatus(status)` | eq status |
| `findActive()` | status=active |
| `findExpiredActive(todayIsoDate)` | status=active AND expiry_date < today |

## ContactRequestRepository

| Method | Notes |
|---|---|
| `findByBuyerId` / `findByFarmerId` / `findByProductId` | |
| `findCompletedForBuyerProduct(buyerId, productId)` | status=completed |

## ReviewRepository

| Method | Notes |
|---|---|
| `findByFarmerId` / `findByProductId` | |
| `findByBuyerAndProduct` | unique constraint FR-06 |

## PriceHistoryRepository

| Method | Notes |
|---|---|
| `findByCategoryId` | |
| `findRecent(limit)` | order recorded_on desc |

## TransportProviderRepository

| Method | Notes |
|---|---|
| `findByLga(lga)` | coverage_lga contains |

## Services (method inventory — signatures stable)

### AuthService
- `register(input)` → PublicUser  
- `login(phone, password)` → { user, session }  
- `logout()`  
- `getSession()` / `getCurrentUser()` / `requireRole(roles)`

### ProductService
- `archiveExpiredListings()`  
- `create` / `update` / `delete` / `getById`  
- `listByFarmer` / `filterCatalogue` / `farmerStats`

### ContactService
- `logAndGetLinks` / `markCompleted` / `listForFarmer` / `listForBuyer` / `openChannel`

### ReviewService
- `submit` / `recomputeFarmerRating` / `listForFarmer` / `listForProduct`

### AdminService
- `getDashboardStats` / `setVerificationStatus` / `listUsers`  
- `listFlaggedProducts` / `setListingStatus` / `flagListing` / `restoreListing` / `removeListing`

### PriceHistoryService
- `recordSnapshots` / `getTopCategoryTrends` / `listHistory`

### ValidationService
- format checks + `sanitizeText` (client first line; RLS/CHECK is real enforcement in Part B)

## Acceptance (Phase 8)

- [x] Every page data need maps to a repository/service method above  
- [x] Interfaces frozen under `lib/repositories/types.ts` and service classes  
- [x] Part B implements same method names; UI unchanged  




