# NAUB Agricultural Marketplace

Online marketplace for agricultural products (thesis implementation: Hussaini Muhammad Ahmad, COS/23U/3712, NAUB).

**Stack:** Next.js App Router + TypeScript + localStorage data layer (Part A) → PostgreSQL/Supabase (Part B, prepared).

## Quick start

```bash
npm install
npm run fetch-demo-images   # once — Unsplash images into public/demo-images
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Getting started

On first load the app seeds **demo listings** (and a few accounts) so Browse is not empty. You can still register new users.

### Demo accounts (password: `password123`)

| Role | Phone |
|------|--------|
| Admin | value of `NEXT_PUBLIC_ADMIN_PHONE` (default `08010000001`) |
| Farmer | `08031112222` (Musa Ibrahim, Biu) |
| Farmer | `08033334444` (Aisha Bello, Hawul) |
| Buyer | `08037778888` (Fatima Sani) |

1. Open **Browse** to see sample produce  
2. Sign in as buyer to contact sellers, or as farmer to manage listings  
3. Register new accounts anytime  

To reload demo data: `/dev/data-test` → **Wipe data & re-bootstrap**.

## Architecture

```
app/ + components/     → Presentation (mobile-first, Poppins)
lib/services/          → Application (business rules)
lib/repositories/      → Data (localStorage or Supabase)
lib/types/             → Schema contract
```

UI never imports repositories or `localStorage` directly. Services return `{ success, data?, error? }`.

`DATA_SOURCE` in `lib/config.ts` is the Part B switch (`local` → `supabase`).

## Deployment

See **[docs/deployment.md](docs/deployment.md)** for full steps.

**Short version:**

1. **UI-only demo:** push to GitHub → deploy on [Vercel](https://vercel.com) with `NEXT_PUBLIC_DATA_SOURCE=local` and `NEXT_PUBLIC_ADMIN_PHONE=…`.
2. **Real backend:** run `supabase/full_migration.sql` in Supabase SQL Editor → set Vercel env to `supabase` + project URL + **anon** key → deploy. Register with the admin phone → open `/admin`.

Never put the Supabase **service_role** key in `NEXT_PUBLIC_*` or the browser.

### Listing photos

Listing photos upload to the Supabase Storage `product-images` bucket when
`NEXT_PUBLIC_DATA_SOURCE=supabase`. The Supabase migration creates the bucket
and its access policies.

## Routes

| Path | Access |
|------|--------|
| `/` | Public landing |
| `/browse`, `/products/[id]`, `/transport` | Public |
| `/login`, `/register` | Auth |
| `/farmer/*` | Farmer |
| `/buyer/*`, `/cart` | Buyer |
| `/admin/*` | Admin |
| `/dev/data-test` | Scratch pad for services |

## Scripts

```bash
npm run dev
npm run build
npm test              # Vitest unit + flow contracts
npm run fetch-demo-images
```

## Part B (Supabase) — ready to flip

Repository implementations live under `lib/repositories/supabase/`.  
`AuthService`, Storage uploads, RLS, and migrations are wired. Switch with env:

### Option A — SQL Editor (hosted Supabase)

1. Open **SQL Editor** in the Supabase Dashboard  
2. Paste and run the full script:  
   **`supabase/full_migration.sql`**  
   (schema + RLS + storage + categories only — no demo products/users)  
3. Copy Project URL + **anon** key into `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. `npm run dev` → users register in the app

Promote an admin after they register:

```sql
update public.profiles
set role = 'admin', verification_status = 'verified'
where phone = '0803XXXXXXX';
```

### Option B — CLI

```bash
cp .env.example .env.local
# set supabase URL + anon key + DATA_SOURCE=supabase

supabase db push   # or: run migrations folder
npm run seed:supabase   # categories/logistics only; clears products
npm run dev
```

Docs: `docs/part-b-cutover.md` · `docs/api-contract.md` · `supabase/full_migration.sql`

## Thesis FR coverage (Part A)

- FR-01 Auth & roles  
- FR-02 Listings  
- FR-03 Farmer dashboard  
- FR-04 Catalogue filters  
- FR-05 WhatsApp / tel contact log  
- FR-06 Reviews & ratings  
- FR-07 Admin stats  
- FR-08 Verify / suspend / ban  
- FR-09 Auto-archive expired  
- FR-10 Price trends  
- NFR-01 Mobile-first + local images  
- NFR-05 Fast registration form  
