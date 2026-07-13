# CHAPTER FOUR

# SYSTEM IMPLEMENTATION

## 4.1 Introduction

This chapter describes how the **NAUB Agric Connect** web application was implemented. It explains the development environment and tools used, presents the system architecture in detail, walks through the realisation of each functional and non-functional requirement in the codebase, and documents the key screens and modules that compose the final product. Screenshots of the running application are inserted at points where the user-facing behaviour of a requirement is described.

The implementation follows the layered architecture that was proposed in Chapter Three (System Design), with a strict separation between presentation (the App Router pages and React components), application logic (the service classes), and data access (the repository layer that is currently backed by the browser's `localStorage` and is prepared for a future swap to Supabase). The repository pattern, together with a single `DATA_SOURCE` switch in `lib/config.ts`, ensures that the move from Part A to Part B of the project does not require any change to the user interface or to the service layer.

## 4.2 Development Environment and Tools

### 4.2.1 Hardware

The system was developed on a personal laptop running Windows 11 Pro (build 26200). No special hardware was required beyond a standard development machine with at least 8 GB of RAM and stable internet access for fetching packages and font assets.

### 4.2.2 Software Stack

The following software tools and frameworks were used during the implementation:

| Layer | Tool / Framework | Version |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | Next.js (App Router) | 16.2.10 |
| UI library | React | 19.2.4 |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS v4 (`@theme` tokens) | 4.x |
| Component primitives | Lucide React icons | latest |
| Data (Part A) | Browser `localStorage` | n/a |
| Data (Part B) | Supabase (Postgres + Auth + RLS + Storage) | latest |
| Image hosting (Part B) | Cloudinary unsigned preset | n/a |
| Tests | Vitest + happy-dom | 3.2.x |
| Linting | ESLint with `eslint-config-next` | 16.2.x |
| Deployment | Vercel | latest CLI |

### 4.2.3 Integrated Development Environment

Visual Studio Code was used as the primary editor. Settings were configured to format on save using the editor defaults and to enable TypeScript strict mode. The TypeScript compiler (`tsc --noEmit`) and Vitest are run from the integrated terminal.

### 4.2.4 Version Control

Git was used for source control, with the repository hosted on GitHub at `github.com/DevRex-X-Spectre/NAUB-Agricultural-Marketplace`. Commits are grouped by feature so that the history of any one module can be reconstructed.

## 4.3 System Architecture Realisation

### 4.3.1 Layered Architecture

The implementation realises the four-layer architecture described in Chapter Three:

```
+--------------------------------------------------+
|  Presentation (app/, components/)                |
|  Next.js App Router · React 19 · Tailwind v4     |
+--------------------------------------------------+
                      ↓ uses only
+--------------------------------------------------+
|  Application (lib/services/)                     |
|  AuthService, ProductService, ContactService,    |
|  ReviewService, AdminService, PriceHistoryService|
+--------------------------------------------------+
                      ↓ uses only
+--------------------------------------------------+
|  Data Access (lib/repositories/)                 |
|  Repository<T> per entity, swapped by DATA_SOURCE|
+--------------------------------------------------+
                      ↓
+--------------------------------------------------+
|  Storage  •  localStorage  (Part A)              |
|            •  Supabase Postgres (Part B)         |
+--------------------------------------------------+
```

The presentation layer never imports a repository directly and never calls `localStorage` directly; the same is enforced by review. The application layer returns a `ServiceResult<T>` shape from every method, which guarantees a consistent success / failure contract that the UI can render uniformly.

```ts
// lib/types/index.ts
export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

### 4.3.2 Repository Interface

All seven entities share the same repository interface (`lib/repositories/types.ts`):

```ts
export interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: UserId): Promise<T | null>;
  create(data: Omit<T, "id"> & { id?: UserId }): Promise<T>;
  update(id: UserId, patch: Partial<T>): Promise<T | null>;
  delete(id: UserId): Promise<boolean>;
}
```

Two concrete implementations exist for each entity: one in `lib/repositories/*.ts` (Part A, `localStorage`) and one in `lib/repositories/supabase/*.ts` (Part B, Supabase). The repository barrel `lib/repositories/index.ts` chooses between the two at module-load time using `DATA_SOURCE`. Because the implementations are interchangeable, the UI does not change when the data source is swapped.

> **[Insert Screenshot 4.1: Repository barrel showing the DATA_SOURCE switch — `lib/repositories/index.ts`]**

### 4.3.3 Service Layer

Each service corresponds to one functional area of the system and encapsulates business rules that the UI should not need to know about. For example, `ContactService.logAndGetLinks` (i) verifies that the product exists and is `active`, (ii) verifies that the farmer's phone number is on file (because that phone is the WhatsApp number used for contact), (iii) verifies that the buyer is a buyer account and has a phone number, (iv) records a `ContactRequest` row, and (v) returns both a `https://wa.me/…` deep link and a `tel:` deep link. The UI simply opens the returned URL.

### 4.3.4 Data Source Switch

`lib/config.ts` exports a single `DATA_SOURCE` value derived from `NEXT_PUBLIC_DATA_SOURCE` at build time. Setting the environment variable to `supabase` and providing the Supabase URL and anon key is sufficient to switch from Part A to Part B without any further code change. A factory helper `assertSupabaseConfigured()` throws if Part B is requested without the necessary environment variables.

```ts
export const DATA_SOURCE: DataSource = resolveDataSource();
export const isSupabase = DATA_SOURCE === "supabase";
export const isLocal = DATA_SOURCE === "local";
```

## 4.4 Data Model

The domain model consists of seven entities. All entities are defined in `lib/types/index.ts` and mirrored by SQL tables in `supabase/full_migration.sql` for Part B.

### 4.4.1 Entity Definitions

**User** – represents a registered person on the platform. Has a role of `farmer`, `buyer` or `admin`; a verification status; contact details; and aggregated rating statistics. User identifiers are numeric auto-increment values in Part A and Supabase auth UUIDs in Part B; the `UserId = number | string` union type accommodates both, and the `sameId(a, b)` helper performs a string-equality comparison that is safe across the two implementations.

**Category** – the agricultural category under which a product is listed (Maize, Sorghum, Livestock, etc.). Each category has a slug and an icon key for rendering.

**Product** – a single listing. Carries the price, unit, quantity, expiry date, LGA, and either a local image path or a remote URL.

**ContactRequest** – a record that a buyer has initiated contact with a farmer on a particular product by a particular method (WhatsApp or call). Once the contact is marked completed, the buyer is permitted to submit a review.

**Review** – a rating (1–5) and an optional comment that a buyer leaves on a completed contact. Triggers an aggregate rating recomputation on the farmer's profile.

**PriceHistory** – daily aggregated price data per category used by the admin price-trends dashboard (FR-10).

**TransportProvider** – a logistics provider listed on `/transport` with contact details and the LGAs they cover.

> **[Insert Table 4.1: Full field list for each entity — see Appendix A]**

### 4.4.2 Database Schema (Part B)

The Part B schema is generated from `supabase/full_migration.sql` and is fully RLS-secured. Key design decisions:

- **`profiles`** table is keyed by `auth.users.id` (UUID). The `password_hash` and `password_salt` columns are present for Part A only and are empty in Part B because Supabase Auth owns passwords.
- **`products`** carries a status enum (`active`, `sold`, `expired`, `flagged`).
- **`contact_requests`** has a composite uniqueness rule that ensures a buyer can only complete one contact per product per farmer (this is the FR-06 "completed-contact-before-review" invariant).
- **`reviews`** has a trigger that recomputes the farmer's `average_rating` and `review_count` on every insert.
- **`price_history`** has a `snapshot_category_prices()` SQL function intended to be called by `pg_cron` for the FR-10 price-trends feature.

> **[Insert Figure 4.1: ER diagram of the seven entities — see Appendix A for the textual schema]**

## 4.5 Authentication and Session Management

### 4.5.1 Registration Flow

Registration is implemented in `lib/services/auth-service.ts → AuthService.register(input)`. The flow is:

1. Run `validationService.validateRegistration` on the input.
2. In Part A: hash the password with SHA-256 + per-account salt using the Web Crypto API; create the user row with `verification_status = "verified"`.
3. In Part B: call `supabase.auth.signUp` with the user's email; create the `profiles` row from the auth user id; mark verified.
4. Return the resulting `PublicUser` (without password fields).

The phone number is **the WhatsApp number** used for contact on listings. The registration form labels the field clearly and includes a hint explaining this. The email is stored but is not used as a public contact channel.

> **[Insert Screenshot 4.2: Registration form showing role selector, fields, and the WhatsApp hint]**

### 4.5.2 Login Flow

Login is implemented in `AuthService.login(identifier, password)` where `identifier` may be either an email or a phone number. The `isLoginIdentifier` validator accepts either format; phone numbers are normalised to the local `0XXXXXXXXXX` form for lookup.

In Part A, the password is verified against the stored hash. In Part B, the identifier is resolved to the user's email (or, for phone-only accounts, a synthetic `<digits>@phone.naub-agri.local` address) and verified through Supabase Auth.

> **[Insert Screenshot 4.3: Login form with email/phone field and password strength meter]**

### 4.5.3 Session Handling

A session is represented by:

```ts
interface Session {
  token: string;
  user_id: UserId;
  role: UserRole;
  issued_at: string;
  expires_at: string;
}
```

In Part A, the session token is a 24-byte cryptographically random value stored in `localStorage` under the `naub_agri:session` key with a 7-day TTL. In Part B, the session is the Supabase auth session, with the access token used as `Session.token`. Both paths expose the session through `AuthProvider` (in `components/providers/auth-provider.tsx`), which is mounted by `AppProviders` at the root of the application so that every page can call `useAuth()`.

### 4.5.4 Admin Promotion

In Part A, the phone number listed in `NEXT_PUBLIC_ADMIN_PHONE` (comma-separated for multiple admins) automatically receives the `admin` role on registration or login. This avoids the need for a separate admin-creation flow during development. In Part B, the same logic is applied through `ensureEnvAdminRole`, which mutates the profile row if the phone matches.

### 4.5.5 Route Protection

`components/auth/require-auth.tsx` is a client-side guard used in each role's layout. On mount, it calls `authService.getCurrentUser()`; if no user is signed in, it redirects to `/login`; if the user's role does not match the layout's allowed roles, it redirects to that user's home page. The redirect uses `router.replace` so that the browser back button does not return to the protected page.

> **[Insert Screenshot 4.4: A protected page (e.g. /farmer) immediately after a successful redirect from RequireAuth]**

## 4.6 Product Listings (Farmer)

### 4.6.1 Create Listing

A farmer with a `verified` status can create a listing through `app/(farmer)/farmer/listings/new/page.tsx`, which renders `components/marketplace/listing-form.tsx`. The form collects name, category, description, price, unit, quantity, expiry date, LGA and an optional photo. The image is uploaded through `lib/media/prepare-listing-image.ts`, which prefers Cloudinary when configured, falls back to Supabase Storage, and otherwise stores a base64 data URL (Part A demo).

On submit, `productService.create()` performs the following checks in addition to the basic validation:

1. The actor is a `farmer` account and is not `suspended`, `banned`, or `pending`.
2. The product fields validate (`name`, `price > 0`, `quantity > 0`, `expiry_date` present).
3. The product is sanitised (`sanitizeText`) before persistence.

The new product is saved with `status = "active"`.

> **[Insert Screenshot 4.5: New-listing form filled in by a farmer]**

### 4.6.2 Edit, Mark Sold, Delete

The same `ListingForm` is reused for editing in `app/(farmer)/farmer/listings/[id]/edit/page.tsx`. Marking a listing as `sold` is a single call to `productService.update(productId, farmerId, { status: "sold" })`. Deletion is a call to `productService.delete` after ownership is verified through `sameId(existing.farmer_id, farmerId)`.

### 4.6.3 Inventory Dashboard

`app/(farmer)/farmer/listings/page.tsx` lists the farmer's listings with a status filter (active, sold, expired, flagged) and a status count summary at the top. The dashboard also calls `productService.farmerStats()` on load to populate the four KPI cards (active / sold / expired / flagged).

> **[Insert Screenshot 4.6: Farmer listings page with KPI cards and the active-listings grid]**

### 4.6.4 Auto-Archive of Expired Listings (FR-09)

`productService.archiveExpiredListings()` is invoked on every dashboard load and on every catalogue filter. It flips the status of any `active` product whose `expiry_date` is earlier than today to `expired`. This guarantees that buyers do not see stale listings and that the freshness badge always reflects the truth.

## 4.7 Catalogue and Product Detail (Buyer / Public)

### 4.7.1 Browse Page

`app/browse/page.tsx` is the public catalogue. It first calls `productService.filterCatalogue({})`, which archives expired listings and then returns the active set. The buyer can filter by category, LGA, freshness (days to expiry), price range, and a free-text search across name and description. Filters are combined into a memoised key so that the catalogue query only re-runs when the filter set actually changes.

For each product, the buyer name and rating are fetched once and displayed on the card. The card uses the stable colour-tinted placeholder if the image fails to load, so the listing is still visible.

> **[Insert Screenshot 4.7: Browse page with sidebar filters and product grid]**

### 4.7.2 Product Detail

`app/products/[id]/page.tsx` shows a single product. It loads the product, the farmer (with password fields stripped), the category, and existing reviews. Three actions are exposed to a signed-in buyer:

1. **WhatsApp seller** — calls `contactService.logAndGetLinks({ ..., method: "whatsapp" })`, which validates both phones, records the contact, and returns a `https://wa.me/<international-phone>?text=<pre-filled message>` deep link that includes the buyer's WhatsApp number in the message body. The page opens the link in a new tab.
2. **Call seller** — same flow with `method: "call"`, returning a `tel:` link.
3. **Add to shortlist** — adds the product id to the buyer's local shortlist (cart) so that the buyer can keep a list of items to follow up on.

The page also shows the farmer's WhatsApp number (with a note explaining that it is the number they registered with) and the farmer's verification status and average rating. Buyers who have completed a contact on this product can submit a review through the inline review form.

> **[Insert Screenshot 4.8: Product detail page showing the WhatsApp number and action buttons]**

### 4.7.3 Contact Logging (FR-05)

`contactService.logAndGetLinks` records a `ContactRequest` row every time a buyer initiates WhatsApp or call contact. This serves two purposes: (i) it provides the contact volume KPI on the admin dashboard, and (ii) it is the gating record that unlocks the review form (FR-06). The contact message is pre-filled using `buyerToFarmerMessage(productName, buyerName, buyerWhatsApp)` so that the farmer receives the buyer's WhatsApp number in the first message and can reply.

## 4.8 Reviews and Ratings (FR-06)

A buyer may submit a review on a product only after they have a `completed` `ContactRequest` for that product. `reviewService.submit()` enforces this rule, and the Part B RLS policy enforces it again at the database layer. After the review is inserted, `recomputeFarmerRating` recalculates the farmer's `average_rating` and `review_count` (the Part B trigger does this in SQL, the Part A path does it in JS).

Reviews are displayed on the product detail page and on the farmer dashboard. The buyer can mark a contact as completed from `app/(buyer)/buyer/contacts/page.tsx`; once marked completed, a **Leave review** button appears next to the contact row.

> **[Insert Screenshot 4.9: Buyer contacts page showing the Mark completed → Leave review flow]**

## 4.9 Admin Dashboard

The admin role has access to four pages under `app/(admin)/admin/`:

| Page | Purpose |
|---|---|
| `/admin` | KPI dashboard with 8 KPIs (users, farmers, buyers, pending verifications, active listings, flagged listings, contact requests, reviews) |
| `/admin/users` | List, search, verify, suspend or ban users |
| `/admin/moderation` | Flagged listings queue + quick-flag action on active listings |
| `/admin/prices` | FR-10 price trends chart + manual snapshot recorder |

### 4.9.1 User Verification (FR-08)

`adminService.setVerificationStatus(userId, status)` updates the verification status of a user. The status values are `pending`, `verified`, `suspended`, `banned`. Suspended and banned users are blocked from signing in through `gateVerification` in the auth service.

> **[Insert Screenshot 4.10: Admin user management page with the verify / suspend / ban actions]**

### 4.9.2 Listing Moderation

`adminService.flagListing(productId)` flips a product to `status = "flagged"` so that it no longer appears in the public catalogue. `restoreListing` reverses the flag, and `removeListing` hard-deletes the listing.

### 4.9.3 Price Trends (FR-10)

`priceHistoryService.recordSnapshots()` snapshots the average price per category for the current day, and `getTopCategoryTrends()` returns the top movers. The admin can trigger a snapshot manually from `/admin/prices`. In Part B this is automated by `pg_cron`.

> **[Insert Screenshot 4.11: Admin price trends page with chart and snapshot button]**

## 4.10 Logistics Directory

`app/transport/page.tsx` lists the `TransportProvider` rows from the database. Each row shows the provider name, phone, LGAs they cover, and notes. The phone is rendered as a click-to-call link. The list can be filtered by LGA.

> **[Insert Screenshot 4.12: Transport providers directory page]**

## 4.11 Notification System

`lib/utils/notifications.ts → computeNotifications(farmerId)` derives a list of in-app notifications from the current state: new contact requests, listings expiring soon, and pending reviews. `components/marketplace/notifications-panel.tsx` renders the list. There is no server-side push; notifications are computed on demand from the data layer on every dashboard load.

## 4.12 User Interface and Design System

### 4.12.1 Design Tokens

The visual design follows the **Seed** palette defined in `app/globals.css` and DESIGN.md:

| Token | Hex | Role |
|---|---|---|
| Forest Canopy | `#1c3a13` | Primary text and CTAs |
| Lime Sprout | `#d3fa99` | Accent and brand mark background |
| Warm Parchment | `#fcfcf7` | Canvas |
| Pale Stone | `#eeeee9` | Secondary surface |
| Soft Sage | `#c4c7c4` | Disabled text |
| Quiet Gray | `#b3b3b3` | Tertiary |

Tailwind v4 `@theme` binds the tokens so they are usable as utility classes (`bg-lime-sprout`, `text-forest-canopy`, etc.) without a separate `tailwind.config.ts`.

### 4.12.2 Typography

Poppins (300/400/500/600) is loaded through `next/font/google` in `app/layout.tsx`. The font is self-hosted at build time, which avoids any runtime request to Google Fonts and contributes to faster page loads.

### 4.12.3 Component Primitives

The UI is built from a small set of typed primitives under `components/ui/`:

- **Button** – four variants (`primary`, `secondary`, `ghost`, `inverse`) with consistent pill radius and min-height tap targets (44 px).
- **Input** – labelled text input with the Seed palette and consistent error styling.
- **PasswordInput** – text input with show/hide toggle and an optional live strength panel.
- **Select** – native `<select>` styled to match the rest of the form.
- **Textarea** – multi-line input with the same height rules.
- **Card** – three surface variants (`default`, `pale`, `parchment`) used across pages.
- **Badge** – pill label with tone variants used for status indicators.

### 4.12.4 Brand Mark

The brand mark used in the site header and on the auth pages is a custom inline SVG component (`components/icons/brand-logo.tsx`) that combines a stylised leaf on a lime-sprout badge with a small connect-arc and two nodes underneath. The mark is used in three sizes (32 px in the header, 48 px on auth pages, 56 px in the loading splash) and may be rendered with or without the **NAUB Agric Connect** wordmark.

> **[Insert Screenshot 4.13: Site header showing the brand mark with wordmark]**
> **[Insert Screenshot 4.14: Login page showing the brand mark above the form]**

### 4.12.5 Mobile-First Layout

All pages are written mobile-first and tested down to a 360 px viewport. The header collapses to a stacked layout on small screens; the catalogue moves its filter panel into a slide-up sheet on mobile; and the farmer dashboard is a single column on small screens and a two-column layout on `lg` and above. Tap targets are at least 44 px tall, satisfying NFR-01.

## 4.13 Demo Seed and Bootstrap

On the first load in Part A mode, `lib/seed.ts → ensureSeeded()` populates `localStorage` with:

- 8 categories (Maize, Sorghum, Millet, Groundnuts, Livestock, Poultry, Dairy, Vegetables),
- 4 users (1 admin, 2 farmers, 1 buyer) with the password `password123`,
- 12 sample product listings across the categories, each with a `/demo-images/<category>/<n>.jpg` image path,
- 3 transport providers.

The seed is versioned (`SEED_VERSION = "v5-email-login"`) so that subsequent changes to the seed automatically re-run on next load. The demo data can be wiped and re-bootstrapped at any time from `/dev/data-test`.

> **[Insert Screenshot 4.15: /dev/data-test page after a successful seed run]**

## 4.14 Deployment

The recommended deployment path is documented in `docs/deployment.md`. Two scenarios are supported:

1. **UI-only demo on Vercel** – `NEXT_PUBLIC_DATA_SOURCE=local` with `NEXT_PUBLIC_ADMIN_PHONE=<your number>`. No database is required.
2. **Production with Supabase** – run `supabase/full_migration.sql` in the Supabase SQL editor, copy the project URL and anon key into the Vercel env, set `NEXT_PUBLIC_DATA_SOURCE=supabase`, redeploy.

Environment variables used by the application are concentrated in `lib/config.ts` and are summarised in Appendix B.

> **[Insert Screenshot 4.16: A live Vercel deployment of the app showing the marketplace]**

## 4.15 Summary

This chapter has documented the realisation of every functional requirement listed in Chapter One and validated through Chapter Three's design. The implementation follows the proposed architecture, uses a strict UI → services → repositories layering, and is prepared for the Part B Supabase migration. The next chapter covers the testing methodology, the test cases that were executed, and an evaluation of the system against the original objectives.