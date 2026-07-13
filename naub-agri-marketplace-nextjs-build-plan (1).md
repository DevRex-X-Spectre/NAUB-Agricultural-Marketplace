# NAUB Agricultural Marketplace — End-to-End Build Plan
### Frontend (Next.js + localStorage prototype) → Backend (PostgreSQL via Supabase), translated from the PHP/MySQL Thesis Spec

**Source document:** *Design and Implementation of an Online Marketplace for Agricultural Products* (Hussaini Muhammad Ahmad, COS/23U/3712, NAUB)
**Frontend stack:** Next.js (App Router) + TypeScript + your existing boilerplate + your `design` skill for UI
**Backend stack:** PostgreSQL via Supabase (Auth, Row Level Security, Storage, scheduled functions)
**Data strategy:** Part A builds a localStorage replica of the schema and business logic behind a strict repository/service interface, so you can build and test the full frontend immediately. Part B implements the real Postgres/Supabase backend against that exact same interface — a swap of internals, not a rewrite.

---

## 0.1 Non-Negotiable: Mobile Responsiveness

The thesis's entire design philosophy is **mobile-first** (§2.2.1, §3.10 row 3–4, NFR-01) — the primary user is a smallholder farmer on a budget Android phone over 2G/3G, not a desktop user. Mobile responsiveness is therefore not a Phase 6 polish item; it is a standing constraint that applies to **every phase from Phase 2 onward**. Concretely:

- Build and test every screen at mobile width first (360–390px), then verify it scales up to tablet and desktop — not the other way around.
- Use your design skill's responsive tokens/breakpoints as-is; do not introduce ad-hoc breakpoints.
- No fixed-width layouts, no horizontal scroll on any page, no tap targets under ~44px, no text below ~14px on mobile.
- Every table-like view (admin dashboards, sales history, price trend data) needs a mobile layout that isn't a shrunk desktop table — stack into cards or use horizontal scroll containers deliberately, never accidentally.
- Images (product photos, especially) must be responsive and lazy-loaded — this is also what NFR-01's 3G load-time target depends on.
- Forms (registration, listing creation) must be single-column and thumb-friendly on mobile — this is the concrete mechanism behind NFR-05's "3-minute registration" target.
- Test on at least one narrow device width and one mid-size (e.g., 375px and 414px) before marking any phase's UI work "done," not just at the end of the project.

This gets folded into the acceptance criteria of Phases 2–6 below (added inline), and Phase 6 keeps a dedicated responsive/performance *audit* pass — but the building itself has to be mobile-first from the first screen in Phase 2, not retrofitted later.

---

## 0. How to Use This Plan

Each phase below is self-contained and has: **Goal → Deliverables → Acceptance Criteria**, mirroring the Waterfall sign-off structure already used in the thesis (Table 3.1), so it will also double as your Chapter 4 (Implementation) documentation later.

Before Phase 1, read (in this order):
1. Your `design` skill folder — this governs every visual decision from here on. No ad-hoc styling.
2. Your existing Next.js boilerplate structure — map the folders below onto whatever's already scaffolded, don't fight the existing structure.

Do not skip the Data Layer (Phase 1). It is the single most important phase — everything else is UI sitting on top of it.

---

## 1. Architecture Overview

The thesis specifies a **Three-Tier Client-Server Architecture** (§3.5): Presentation / Application / Data. We keep that shape exactly, we just relocate where "Application" and "Data" physically live for now:

| Tier | Thesis (PHP/MySQL) | This build (Next.js, Phase 1) | Future backend swap |
|---|---|---|---|
| Presentation | HTML5/CSS3/vanilla JS | Next.js App Router pages + components (your design skill) | unchanged |
| Application (business logic) | PHP 8.2 | `/lib/services/*.ts` — TypeScript service classes | same service classes, same method signatures |
| Data | MySQL 8.0 via PDO | `/lib/repositories/*.ts` — localStorage-backed repositories implementing a shared interface | swap implementation to call your real API; interfaces don't change |

**The rule that makes migration painless:** UI components call **services**, never repositories, and never `localStorage` directly. Services call repositories. Repositories are the *only* files that know localStorage exists. When the backend is ready, you rewrite the repository implementations to call `fetch('/api/...')` instead — the services and every page/component above them stay untouched.

```
app/                          → Presentation tier (pages, routes)
components/                   → Presentation tier (your design skill applies here)
lib/
  types/                      → Shared TS interfaces = the DB schema (Phase 1)
  repositories/                → Data tier — localStorage CRUD (swap point for backend)
  services/                    → Application tier — business logic, validation, auth
  utils/                       → id generation, formatting, whatsapp deeplinks etc.
```

---

## 2. Data Model (translated from §3.8 Database Design)

The thesis normalizes to 3NF across "seven core tables" but only fully specifies four (`tbl_users`, `tbl_products`, `tbl_contact_requests`, `tbl_reviews`) plus references `tbl_categories`. To hit the functional requirements (FR-10 price trends, logistics directory in §1.4), the remaining tables are `tbl_categories`, `tbl_price_history`, and `tbl_transport_providers`. All seven are specified below so the schema is complete and internally consistent — this is what your `lib/types/` will encode as TypeScript interfaces.

| # | Table (thesis name) | Purpose | Key relations |
|---|---|---|---|
| 1 | `tbl_users` | Farmers, buyers, admins | — |
| 2 | `tbl_categories` | Product category taxonomy | referenced by products |
| 3 | `tbl_products` | Listings | FK → users (farmer_id), categories |
| 4 | `tbl_contact_requests` | Buyer→farmer negotiation log | FK → users ×2, products |
| 5 | `tbl_reviews` | Post-transaction ratings | FK → users ×2, products |
| 6 | `tbl_price_history` | Snapshot for FR-10 price trend dashboard | FK → categories |
| 7 | `tbl_transport_providers` | Curated logistics directory (§1.4 scope) | — |

Every field, type, and constraint from Tables 3.4–3.7 (users, products, contact_requests, reviews) carries over exactly — `user_role` enum, `is_verified` status codes (0 Pending/1 Verified/2 Suspended/3 Banned), `listing_status` enum (active/sold/expired/flagged), bcrypt-equivalent password hashing, etc. These become TypeScript `enum`/union types and interface fields in Phase 1, not database columns — but the *shape and constraints are identical*, which is the whole point.

---

## Phase 0 — Foundation Audit & Environment Setup

**Goal:** Confirm the boilerplate and design skill are correctly wired before any feature code is written.

**Deliverables:**
- Confirm design skill tokens (colors, typography, spacing, component primitives) are read and understood; note any gaps that will need to be filled for agri-marketplace-specific UI (star ratings, price tags, freshness/expiry badges, verification badges).
- Confirm App Router structure, layout conventions, and any existing auth/middleware scaffolding in the boilerplate.
- Decide folder conventions per the architecture diagram in §1 above.
- Add a single `lib/config.ts` with a `DATA_SOURCE` flag (`'local'` for now) — this is the switch that will later flip to `'api'`.

**Acceptance criteria:** A blank Next.js page renders using a design-skill component with zero hardcoded styles; folder scaffolding exists and compiles.

---

## Phase 1 — Data Layer (the MySQL replica)

This is the phase that determines whether backend migration later takes an afternoon or a rewrite. Build it carefully.

### 1.1 Types (`lib/types/`)
TypeScript interfaces for all 7 tables above, field-for-field matching §3.8. Include the enums (`UserRole`, `VerificationStatus`, `ListingStatus`, `ContactMethod`, `RequestStatus`) exactly as specified so validation logic in later phases has somewhere to anchor.

### 1.2 Storage engine (`lib/repositories/storage-engine.ts`)
A tiny internal wrapper — not exposed outside `lib/repositories/` — that provides:
- `getAll<T>(table)`, `getById<T>(table, id)`, `insert<T>(table, record)`, `update<T>(table, id, patch)`, `remove(table, id)`, `query<T>(table, predicate)`
- Auto-incrementing IDs per table (mimics `AUTO_INCREMENT`)
- JSON serialize/deserialize, with a namespaced key per table (`naub_agri:users`, `naub_agri:products`, etc.)
- All methods return **Promises**, even though localStorage is synchronous — this is deliberate, so calling code already looks like it's awaiting a network call, and swapping in real `fetch()` later requires no call-site changes.

### 1.3 Repositories (`lib/repositories/*.ts`)
One per table: `UserRepository`, `ProductRepository`, `CategoryRepository`, `ContactRequestRepository`, `ReviewRepository`, `PriceHistoryRepository`, `TransportProviderRepository`. Each implements a shared `Repository<T>` interface (`findAll`, `findById`, `create`, `update`, `delete`, plus table-specific finders like `findByFarmerId`, `findActiveByCategory`). This is the **only place `localStorage` is ever imported.**

### 1.4 Services (`lib/services/*.ts`) — business logic, matching PHP application tier

| Service | Responsibilities (from FRs/NFRs) |
|---|---|
| `AuthService` | Register, login, session token issuance, role-based session storage, password hashing (Web Crypto `SubtleCrypto` SHA-256+salt as a client-side stand-in for bcrypt — flagged clearly in code comments as "swap for server-side bcrypt on backend migration") |
| `ProductService` | Create/edit/delete listing (FR-02), auto-archive expired listings on app load (FR-09), category/price/LGA/freshness filtering (FR-04) |
| `ContactService` | Log contact requests, generate WhatsApp deep link + `tel:` link (FR-05) |
| `ReviewService` | Submit review, aggregate seller star rating (FR-06), one-review-per-transaction enforcement |
| `AdminService` | Verify/suspend/ban users (FR-08), flag/moderate listings, dashboard aggregate stats (FR-07) |
| `PriceHistoryService` | Record price snapshots, compute top-10 traded category trends (FR-10) |
| `ValidationService` | Central input validation (email format, phone format, required fields) — the client-side analogue of NFR-03's server-side parameterized-query safety net; also strips/escapes any user-entered text before it's rendered, as a stand-in for the XSS protections NFR-03 requires server-side |

**Response shape convention (critical for painless migration):** every service method returns
```ts
{ success: boolean; data?: T; error?: string }
```
This is exactly what a REST/JSON API returns. Components never need to know whether the data came from localStorage or a network call.

### 1.5 Seed data
A `lib/seed.ts` that seeds categories (maize, sorghum, millet, livestock, poultry, dairy, vegetables per §1.4 Product Scope), a handful of demo farmers/buyers/admin, and sample listings — runs once on first load if storage is empty.

### 1.6 Demo Images for Seed Data

Seed listings need real-looking product photos to make the demo credible, but they must come from a source that's actually free to use — not scraped from news articles, blogs, or search results, which are copyrighted and not safe to bundle into a codebase even for a demo.

**Sourcing rule:** use only images explicitly released under a free-use license — **Unsplash, Pexels, or Pixabay** (all three offer royalty-free images usable in commercial/demo projects without attribution). When building this out in your actual environment, search those sites directly (or their APIs) for each category rather than pulling from general web search results.

**Category shopping list** (matches §1.4 Product Scope): maize, sorghum/millet grain, groundnuts, cattle, goats, poultry/chickens, dairy/milk, tomatoes, peppers, leafy greens/vegetables — plus a handful of generic portrait photos for farmer/buyer avatar placeholders.

**Implementation approach — download, don't hotlink:** pull a curated set of images from Unsplash/Pexels once, save them into `public/demo-images/<category>/`, and reference them by local path in `seed.ts` (e.g., `/demo-images/maize/1.jpg`). This is deliberately more reliable than hotlinking to an external CDN at runtime:
- No dependency on a third party's uptime for your demo to work
- No added network latency — which directly supports the NFR-01 low-bandwidth goal your thesis is built around, since the seed data itself should demonstrate the performance philosophy, not undercut it
- Works fully offline for classroom/defense demos with no internet

A one-time `scripts/fetch-demo-images.ts` (or manual download pass) that pulls ~2–3 images per category into `public/demo-images/` is a reasonable Phase 1 task — treat it as part of the seed data deliverable, not a separate phase.

**Acceptance criteria (updated):** Every seeded listing has a locally-stored, properly licensed product image; no seed image is hotlinked from an external, non-free-license source; every repository/service method is callable from a scratch test page and returns the correct `{success, data, error}` shape; seed data populates on first run; re-running does not duplicate.

---

## Phase 2 — Auth & Onboarding (FR-01, NFR-05)

**Deliverables:**
- Landing page (public, marketplace pitch, browse-without-login preview)
- Registration: role selection (Farmer/Buyer), full name, phone, LGA dropdown, password — must be completable in under 3 minutes of realistic user effort (NFR-05 target)
- Login + session persistence (localStorage-based session token, respecting `is_verified` gating — pending/suspended/banned users get a clear status message, not a silent failure)
- Protected route middleware: farmer-only, buyer-only, admin-only route groups under `app/(farmer)/`, `app/(buyer)/`, `app/(admin)/`
- Logout, last_login timestamp update

**Acceptance criteria:** All three roles can register/login/logout; a banned/suspended account is blocked with a clear message; protected routes redirect unauthenticated users; registration and login forms are single-column, thumb-friendly, and fully usable at 375px width with no horizontal scroll.

---

## Phase 3 — Farmer Module (§1.4 Farmer Module, FR-01–03, FR-09)

**Deliverables:**
- Farmer dashboard: active listings count, received contact requests, sales/history stats (FR-03)
- Create listing: product name, category, description, price/unit, unit type, quantity, expiry date, photo (store as base64 or object URL in this phase — flag clearly for real file-storage swap later)
- Edit / delete listing
- Auto-archive: on dashboard load, run `ProductService` expiry check and flip status to `expired` (FR-09) — visually distinct badge, not silently hidden
- Inventory list with status filters (active/sold/expired/flagged)

**Acceptance criteria:** A farmer can complete the full listing lifecycle; an expired listing auto-archives without a page refresh trick; dashboard stats update live; the listing form (including photo upload) and dashboard stat cards are fully usable one-handed on a 375px screen, with no reliance on hover states.

---

## Phase 4 — Buyer Module (§1.4 Buyer Module, FR-04–06)

**Deliverables:**
- Catalogue/browse page: filter by category, price range, LGA, freshness (days-to-expiry) — mobile-first, image-led per §2.2.1's low-literacy design finding (icon-driven categories, not text-heavy)
- Product detail page: seller star rating + review summaries (FR-06), price, quantity, expiry
- "Contact Seller" button → pre-populated WhatsApp deep link *and* direct `tel:` link (FR-05) — logs a `ContactRequest` on click regardless of which channel is chosen
- Lightweight virtual cart (§1.4 scope) — since there's no checkout/payment in scope, this functions as a shortlist/"contact these sellers" list, not a transactional cart; make that framing explicit in the UI copy
- Submit review after marking a contact as completed

**Acceptance criteria:** Filtering works correctly across all four dimensions; contact click always logs a request before opening WhatsApp/tel; reviews correctly recompute the seller's aggregate rating; the catalogue grid reflows cleanly from multi-column (desktop) to single/double-column (mobile) with no image distortion, and filters are reachable via a mobile-friendly pattern (bottom sheet/drawer) rather than a cramped inline row.

---

## Phase 5 — Admin Module (§1.4 Admin Module, FR-07–08)

**Deliverables:**
- Admin dashboard: registration stats, active listing count, flagged-content queue (FR-07)
- User management: verify / suspend / ban (writes to `is_verified` per the four-state enum) (FR-08)
- Content moderation: review flagged listings, remove or restore
- Price trend view: top-10 traded categories, historical average (FR-10), backed by `PriceHistoryService`

**Acceptance criteria:** Status changes made by admin immediately affect what the affected farmer/buyer sees on next load (e.g., a suspended farmer can't create new listings); flagged content queue reflects real listing flags; admin dashboard data tables collapse into a readable mobile card/list layout rather than a squeezed table, since admins may moderate from a phone.

---

## Phase 6 — Cross-Cutting Concerns

**Deliverables:**
- Notifications (in-app, not push): "new contact request," "listing expiring in 3 days" — computed from repository state on load, no backend needed
- Global search across listings
- **Dedicated responsive audit** (not the first mobile pass — the verification pass, since mobile-first was already the default posture from Phase 2 onward per §0.1): walk every screen built in Phases 2–5 at 375px, 414px, 768px (tablet), and 1280px+ (desktop); fix any regressions, especially in forms, tables/dashboards, and the product grid
- Performance pass matching NFR-01's 3G-load-time spirit: lazy-load images, avoid layout shift (reserve image dimensions), keep JS payload lean (no heavy client libraries where a lighter one will do — matches the thesis's vanilla-JS-for-performance rationale even though we're in Next.js), throttle network in devtools to simulate 3G and confirm the experience holds up
- Accessibility pass: semantic HTML, alt text on all product images, keyboard navigation, sufficient tap-target sizing (≥44px) throughout

**Acceptance criteria:** Every screen from Phases 2–5 passes the 375/414/768/1280px sweep with no horizontal scroll, no overlapping elements, and no sub-44px tap targets; Lighthouse mobile score reasonable under simulated 3G throttling (treat as a proxy for NFR-01 since we can't literally 3G-throttle localStorage); no console errors; core flows keyboard-navigable.

---

## Phase 7 — Validation, Security-in-Spirit, and Testing

Real SQL injection/XSS protection (NFR-02, NFR-03) is a server-side concern and doesn't fully apply to a localStorage prototype — but build the *habits* now so the real backend inherits clean patterns:
- All user input passed through `ValidationService` before storage or render (sanitize, don't just trust)
- Password never stored/logged in plaintext, even client-side (hash before it touches the repository)
- Unit tests for every repository and service method (Jest or your boilerplate's existing test setup)
- Integration tests for the three critical flows: register→list→browse→contact, admin verify/suspend, review submission→rating recompute

**Acceptance criteria:** Test suite passes; no plaintext password ever appears in localStorage inspection; malformed input (script tags, oversized strings) is rejected or sanitized before storage.

---

## Phase 8 — Backend Migration Readiness (the payoff)

This is the phase that proves the architecture was worth the discipline. It's the bridge between the frontend track (Phases 0–7 above) and the concrete backend track (Part B below, now that the stack is decided: **PostgreSQL via Supabase**).

**Deliverables:**
- A short **API contract doc** generated from the repository interfaces — each repository method becomes one Supabase operation spec (table, method, filters, expected shape). Since services already return `{success, data, error}`, this doc is close to a formality, not a redesign.
- Confirm every repository method used across Phases 2–7 has a 1:1 counterpart planned in Part B's repository-swap mapping (§B5) — if something's missing, that's a Part B gap to fix before cutover, not a frontend workaround.
- Freeze the `Repository<T>` interfaces — Part B implements against these signatures exactly; no interface changes during backend build.

**Acceptance criteria:** Every page and component's data needs are traceable to a specific Part B repository method; the interface contract is frozen and documented before backend implementation starts.

---

# PART B — Backend Development Plan (PostgreSQL + Supabase)

This part turns the "migration-ready" architecture from Part A into a real, production backend. Because Phase 1 was built with a strict `Repository<T>` interface and every service already speaks in `{success, data, error}`, this is genuinely a **swap of implementation, not a redesign** — the payoff the whole localStorage phase was built for.

## B0. What Carries Over vs. What's New

| From Part A | Becomes in Part B |
|---|---|
| `lib/types/*.ts` (7 interfaces) | Postgres tables + native `enum` types — same shape, now with real DB-level constraints |
| `lib/repositories/*.ts` (localStorage) | `lib/repositories/*.ts` (Supabase client) — same method signatures, same file names, different internals |
| `AuthService` (client-side hash) | Supabase Auth — real password hashing, session/JWT handling, no more hand-rolled crypto |
| `ValidationService` (client-only sanitization) | Stays as first line of defense, now backed by Postgres `CHECK` constraints and RLS as the real enforcement layer (NFR-02, NFR-03 finally *fully* satisfied, not just "in spirit") |
| Client-side expiry check / rating recompute (Phase 3, Phase 4) | Postgres triggers / scheduled functions — server-enforced, can't be bypassed by a modified client |
| `public/demo-images/` local seed images | Supabase Storage bucket, with real farmer-uploaded photos going forward |

---

## B1. Supabase Project Setup & Postgres Schema

**Deliverables:**
- Create the Supabase project (dev + eventually a separate prod project); install Supabase CLI locally for migration-based workflow (`supabase init`, `supabase migration new ...`) rather than editing schema through the dashboard — this keeps schema changes versioned and reviewable, matching the discipline of the rest of this plan.
- Translate the 7 tables from §2 (Data Model) into Postgres DDL, preserving every constraint from the thesis's Tables 3.4–3.7 exactly. Native Postgres `enum` types replace the TypeScript unions:

```sql
-- supabase/migrations/0001_init.sql
create type user_role as enum ('farmer', 'buyer', 'admin');
create type verification_status as enum ('pending', 'verified', 'suspended', 'banned');
create type listing_status as enum ('active', 'sold', 'expired', 'flagged');
create type contact_method as enum ('whatsapp', 'call');
create type request_status as enum ('sent', 'completed');

-- profiles extends Supabase's built-in auth.users (see §B2)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  lga text not null,
  role user_role not null,
  verification_status verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  icon text
);

create table public.products (
  id bigint generated always as identity primary key,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint not null references public.categories(id),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  unit text not null,
  quantity numeric(12,2) not null check (quantity >= 0),
  expiry_date date not null,
  status listing_status not null default 'active',
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_requests (
  id bigint generated always as identity primary key,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  method contact_method not null,
  status request_status not null default 'sent',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id bigint generated always as identity primary key,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (buyer_id, product_id) -- one review per completed transaction (FR-06)
);

create table public.price_history (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id),
  avg_price numeric(12,2) not null,
  recorded_on date not null default current_date
);

create table public.transport_providers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  coverage_lga text,
  notes text
);

-- Indexes matching realistic query patterns from Phases 3–5
create index idx_products_farmer on public.products(farmer_id);
create index idx_products_category_status on public.products(category_id, status);
create index idx_products_expiry on public.products(expiry_date) where status = 'active';
create index idx_contact_requests_farmer on public.contact_requests(farmer_id);
create index idx_reviews_farmer on public.reviews(farmer_id);
```

- Run this as the first Supabase migration, applied to a local dev instance first (`supabase start` — runs Postgres in Docker locally) before ever touching the hosted project.

**Acceptance criteria:** `supabase db reset` runs cleanly against the migration from scratch; schema matches Part A's TypeScript interfaces field-for-field; no orphaned FK possibilities (all `on delete` behavior explicitly chosen, not left to default).

---

## B2. Auth Migration to Supabase Auth

**Deliverables:**
- Replace `AuthService`'s hand-rolled hashing with **Supabase Auth** (email + password, or phone + OTP if that fits the target users better than email — worth a quick decision given the thesis's rural/low-literacy user base described in §2.2.1).
- `profiles` table (already in the B1 schema) extends `auth.users` — a Postgres trigger auto-creates a `profiles` row on signup, defaulting `role` from signup metadata and `verification_status` to `'pending'`:

```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, lga, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'lga',
    (new.raw_user_meta_data->>'role')::user_role
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- Wire up `@supabase/ssr` in the Next.js App Router: a server client for Server Components/Actions, a browser client for client components, and middleware that refreshes the session cookie on every request — this is what protected routes from Phase 2 will run against instead of a localStorage session token.
- `AuthService.register` / `.login` / `.logout` method signatures stay the same (per the Repository/Service contract from Phase 1) — only their internals change to call `supabase.auth.signUp()` / `signInWithPassword()` / `signOut()`.

**Acceptance criteria:** All Phase 2 auth flows work unchanged from the UI's perspective; `verification_status` gating still blocks pending/suspended/banned users, now enforced at the RLS level (§B3) as well as in the UI.

---

## B3. Row Level Security (RLS) — this is where the real enforcement of NFR-02/03 lands

Every table gets `alter table ... enable row level security;` and explicit policies. This is the single most important security deliverable in Part B — it's what makes the backend actually trustworthy instead of just "the frontend is polite about it."

| Table | Policy summary |
|---|---|
| `profiles` | Anyone can read basic public fields (name, role) for display purposes; only the owning user can update their own row; only admins can update `verification_status` |
| `categories` | Public read; only admins can write |
| `products` | Public can `select` where `status = 'active'`; farmers can `select`/`update`/`delete` their own rows regardless of status; only a **verified** farmer (`verification_status = 'verified'`) can `insert` |
| `contact_requests` | A buyer can `insert` their own; a farmer can `select` requests where they're the `farmer_id`; a buyer can `select` requests where they're the `buyer_id`; no `update`/`delete` by non-admins (preserves an honest audit log) |
| `reviews` | Public can `select`; a buyer can `insert` only if they have a `completed` contact_request for that product+farmer (enforced via a policy subquery, not just client-side trust); no edits after submission |
| `price_history` | Public read; only a scheduled function (§B6) writes, via `security definer` |
| `transport_providers` | Public read; only admins write |

Example policy pattern (products table):

```sql
alter table public.products enable row level security;

create policy "public can view active listings"
  on public.products for select
  using (status = 'active' or farmer_id = auth.uid());

create policy "verified farmers can create listings"
  on public.products for insert
  with check (
    farmer_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'farmer' and verification_status = 'verified'
    )
  );

create policy "farmers manage their own listings"
  on public.products for update using (farmer_id = auth.uid());

create policy "farmers delete their own listings"
  on public.products for delete using (farmer_id = auth.uid());
```

Admin-wide access is handled via a separate policy checking `role = 'admin'` in `profiles`, added per table alongside the ones above — admins need `select`/`update` across `products`, `profiles`, and moderation-relevant tables to power Phase 5's dashboard.

**Acceptance criteria:** With RLS enabled and the anon/authenticated keys only (never the service role key) used from the Next.js app, every one of Phase 3–5's flows still works exactly as before — and, critically, a manual attempt to read/write data outside a user's own scope (tested directly against the Supabase REST endpoint, bypassing the UI) is rejected by Postgres itself, not just hidden by the frontend.

---

## B4. Storage — Product Images

**Deliverables:**
- A `product-images` Supabase Storage bucket, public-read, with an upload policy restricting writes to `auth.uid() = farmer_id` (folder-per-farmer convention: `product-images/{farmer_id}/{product_id}/{filename}`).
- Migrate the Phase 1.6 demo image set from `public/demo-images/` into this bucket as part of the Postgres seed script (§B8), so dev/staging looks identical to what farmers will produce for real.
- Farmer listing form (Phase 3) swaps its base64/local-file placeholder for a real `supabase.storage.from('product-images').upload(...)` call — client-side image compression (e.g., resize before upload) is worth adding here given NFR-01's bandwidth constraint.

**Acceptance criteria:** Uploaded images are retrievable via public URL; a farmer cannot upload into another farmer's folder (tested directly against Storage API, not just the UI); demo/seed listings display correctly from bucket-hosted images.

---

## B5. Repository Layer Swap — the actual migration mechanics

This is the concrete execution of Phase 8's promise. For each repository, only the internals change — method names, parameters, and return shapes are untouched.

| Repository method (unchanged signature) | localStorage version (Part A) | Supabase version (Part B) |
|---|---|---|
| `ProductRepository.findActiveByCategory(categoryId)` | filter in-memory array | `.from('products').select().eq('category_id', id).eq('status','active')` — RLS already filters to public-visible rows |
| `ProductRepository.create(data)` | push to array, save to localStorage | `.from('products').insert(data).select().single()` — RLS enforces the "verified farmers only" rule server-side |
| `UserRepository.findById(id)` | `getById` on storage engine | `.from('profiles').select().eq('id', id).single()` |
| `ContactRequestRepository.create(data)` | push + save | `.from('contact_requests').insert(data)` |
| `ReviewRepository.create(data)` | push + save, then manually recompute avg in `ReviewService` | `.from('reviews').insert(data)` — average recompute now happens in a Postgres trigger (§B6), not client code |
| `AdminRepository` verify/suspend/ban | direct localStorage patch | `.from('profiles').update({ verification_status })` — allowed only under the admin RLS policy |

Set `DATA_SOURCE = 'supabase'` in `lib/config.ts` and implement repositories one at a time, starting with `UserRepository` (lowest fan-out), same order Phase 8 specified. Run the Phase 7 integration test suite against each swapped repository before moving to the next — catching an RLS misconfiguration early is far cheaper than discovering it after all seven are swapped.

**Acceptance criteria:** All seven repositories implement the Supabase client internally; zero changes required in `lib/services/`, `app/`, or `components/`; Phase 7's test suite passes against the real backend.

---

## B6. Server-Side Business Logic (Postgres functions, triggers, scheduled jobs)

Logic that lived client-side in Part A (because there was no server to put it on) moves to the database, where it can't be bypassed:

- **Auto-archive expired listings (FR-09):** a Postgres function plus a scheduled job via the `pg_cron` extension (available on Supabase), running e.g. hourly:
```sql
create function public.archive_expired_listings() returns void as $$
  update public.products set status = 'expired'
  where status = 'active' and expiry_date < current_date;
$$ language sql security definer;

select cron.schedule('archive-expired-listings', '0 * * * *', 'select public.archive_expired_listings()');
```
- **Rating aggregation (FR-06):** a trigger on `reviews` insert that recomputes and caches the farmer's average rating (either as a materialized column on `profiles` or computed on read via a view — a cached column is usually the better call for a dashboard that reads it often).
- **Price history snapshots (FR-10):** a daily scheduled function that averages `products.price` per category into `price_history` — same `pg_cron` pattern as archiving.
- **WhatsApp/`tel:` deep links (FR-05):** no change — these stay entirely client-side, they were never a backend concern.

**Acceptance criteria:** Expired listings flip status without any client needing to be open when the deadline passes; a new review immediately reflects in the farmer's displayed rating; `price_history` accumulates daily without manual intervention.

---

## B7. Security Hardening & Full NFR Compliance

Part A's Phase 7 covered validation "in spirit" since there was no real server. Part B is where NFR-02 and NFR-03 become fully, not partially, satisfied:

- Parameterized queries: automatic via the Supabase client — no raw string SQL concatenation anywhere in `lib/repositories/`.
- Real bcrypt-strength password hashing: handled entirely by Supabase Auth (no more client-side SHA-256 stand-in).
- RLS as defense-in-depth: even if a bug in `lib/services/` fails to check a permission, Postgres itself still enforces it — this is the single biggest security upgrade from Part A to Part B.
- Service role key (which bypasses RLS) is used **only** in trusted server contexts (scheduled functions, admin-only Server Actions) — never shipped to the browser bundle. Double-check this explicitly before deployment; it's the most common Supabase misconfiguration.
- Rate limiting on auth endpoints (Supabase Auth has basic built-in protections; consider additional middleware-level throttling on registration if abuse becomes a concern).
- Input validation stays in `ValidationService` as the first line of defense (better UX — fail fast client-side) with Postgres `CHECK` constraints and RLS as the layer that actually can't be bypassed.

**Acceptance criteria:** A direct, authenticated-but-unprivileged request against the Supabase REST API (bypassing the Next.js app entirely) cannot read/write anything outside that user's RLS-permitted scope; no service role key appears in any client-side bundle (verify via a production build inspection).

---

## B8. Local Dev, Seeding, and Migration Workflow

**Deliverables:**
- Standard loop: `supabase start` (local Postgres + Auth + Storage in Docker) → develop and test against it → `supabase db diff` to generate migration files → commit migrations → apply to hosted dev project → eventually promote to prod.
- `supabase/seed.sql` (or a TypeScript seed script run via the Supabase client) that recreates Part A's demo dataset — same farmers/buyers/admin, same listings, now pointing at the Storage-bucket images from §B4 instead of local files.
- Never hand-edit schema directly on the hosted dashboard for anything beyond quick experiments — always round-trip through a migration file, or dev/prod schemas will drift.

**Acceptance criteria:** A fresh clone of the repo can run `supabase start`, apply migrations, run the seed script, and get an identical dev environment to everyone else on the project — no manual dashboard steps required.

---

## B9. Deployment & Cutover Checklist

1. Create the production Supabase project; apply all migrations via CLI (never manually).
2. Set production environment variables in your hosting platform (Supabase URL, anon key — **never** the service role key — in the Next.js app's env).
3. Run the seed script against production **only** if a demo/defense environment is desired with fake data; otherwise start with just categories and an admin account.
4. Deploy the Next.js app (Vercel is the natural fit for App Router + Supabase) with `DATA_SOURCE='supabase'`.
5. Run the full Phase 7 test suite one more time against production before considering it live.
6. Smoke-test the three critical flows manually end-to-end in production: register→list→browse→contact, admin verify/suspend, review→rating recompute.

**Acceptance criteria:** Production deployment passes the same acceptance criteria as every earlier phase, against real infrastructure instead of localStorage or local dev Postgres — this is the point at which the project is genuinely done, not just demo-ready.

---

## Quick-Reference: Phase → Thesis Section Mapping

| Build phase | Thesis section it fulfills |
|---|---|
| 0 | — (setup) |
| 1 | §3.8 Database Design, §3.5 Architecture |
| 2 | FR-01, NFR-05 |
| 3 | Farmer Module (§1.4), FR-02, FR-03, FR-09 |
| 4 | Buyer Module (§1.4), FR-04, FR-05, FR-06 |
| 5 | Admin Module (§1.4), FR-07, FR-08, FR-10 |
| 6 | NFR-01 (performance), NFR-05 (usability), §2.2.1 (accessibility) |
| 7 | NFR-02, NFR-03, NFR-06 (in spirit — real enforcement lands in Part B) |
| 8 | Bridge phase — freezes the contract Part B builds against |
| B1 (schema) | §3.8 Database Design, now as real Postgres DDL |
| B2 (auth) | FR-01, NFR-05 — now backed by real Supabase Auth |
| B3 (RLS) | NFR-02, NFR-03 — this is where these are *fully*, not partially, satisfied |
| B4 (storage) | FR-02 (listing photos), NFR-01 (bandwidth-aware upload) |
| B5 (repo swap) | The literal fulfillment of the thesis's "future work: production deployment" note |
| B6 (server logic) | FR-06, FR-09, FR-10 — moved from client trust to server enforcement |
| B7 (hardening) | NFR-02, NFR-03, NFR-06 — closes the loop fully |
| B8–B9 (dev workflow, deploy) | Chapter 5 "Recommendations/Future Work" — this *is* that future work, executed |

---

*Next step: work through Phase 0 and Phase 1 first, in your own environment, with your design skill and boilerplate open. Phases 2–7 build the full frontend against localStorage. Once that's solid and Phase 8 has frozen the repository contract, Part B (B1–B9) is a self-contained backend build that swaps the data layer's internals without touching a single page or component above it.*
