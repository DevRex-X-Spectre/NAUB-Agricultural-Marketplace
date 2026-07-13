# Deployment guide — NAUB Agricultural Marketplace

You can deploy in two modes: **localStorage prototype** (demo / thesis UI) or **production with Supabase**.

---

## Architecture at deploy time

```
┌─────────────────────┐         ┌──────────────────────────┐
│  Next.js app        │         │  Supabase (optional)     │
│  Vercel / Node host │────────▶│  Auth · Postgres · RLS   │
│  App Router pages   │  HTTPS  │  Storage (product images)│
└─────────────────────┘         └──────────────────────────┘
```

| Mode | `NEXT_PUBLIC_DATA_SOURCE` | Data lives in |
|------|---------------------------|---------------|
| **A — Prototype** | `local` (default) | Browser localStorage only |
| **B — Production** | `supabase` | Supabase project |

---

## Option A — Frontend only (fastest demo)

Good for: classroom demo, UI walkthrough, no backend setup.

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework: **Next.js** (auto-detected).
4. Environment variables (optional for pure local mode):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_DATA_SOURCE` | `local` |
   | `NEXT_PUBLIC_ADMIN_PHONE` | your admin phone e.g. `0801…` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | unsigned preset name |

5. Deploy. Listing photos go to Cloudinary when configured. Other data stays **in each visitor’s browser** unless you use Supabase.

See **[cloudinary-setup.md](./cloudinary-setup.md)**.

```bash
# Or CLI
npm i -g vercel
vercel
```

---

## Option B — Full stack (shared data, real auth)

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste and run  
   **`supabase/full_migration.sql`**  
   (schema, RLS, storage bucket, categories — no demo listings).
3. **Project Settings → API** — copy:
   - Project URL  
   - `anon` `public` key  
   - (Optional, server scripts only) `service_role` key — **never** put this in `NEXT_PUBLIC_*`.

### 2. Host the Next.js app (Vercel recommended)

1. Import the same GitHub repo on Vercel.
2. Set env vars:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_DATA_SOURCE` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `NEXT_PUBLIC_ADMIN_PHONE` | phone that becomes admin on register/login |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | unsigned upload preset |

3. Deploy. Vercel builds with `next build` and serves on a `*.vercel.app` URL (custom domain optional).  
Listing photos use Cloudinary even when product rows live in Supabase.

### 3. First admin

1. Open the live site → **Register** with the phone in `NEXT_PUBLIC_ADMIN_PHONE`.
2. Sign in → you should reach **`/admin`**.
3. Or promote any user in Supabase SQL:

```sql
update public.profiles
set role = 'admin', verification_status = 'verified'
where phone = '0803XXXXXXX';
```

### 4. Auth redirect URLs (Supabase)

In Supabase → **Authentication → URL configuration**:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

(Email confirmation can stay disabled for phone-style synthetic emails used by this app.)

---

## What goes where

| Concern | Where it runs |
|---------|----------------|
| UI (App Router) | Vercel / Node host |
| Session (local mode) | Browser localStorage |
| Session (supabase) | Supabase Auth cookies (refreshed by `proxy.ts`) |
| Passwords | Supabase Auth (production) or client hash (local only) |
| Product photos | **Cloudinary** (primary) via `NEXT_PUBLIC_CLOUDINARY_*`; else Supabase Storage; else local base64 |
| Admin phone | Env only — change without redeploying code if you update env + redeploy |

---

## Deploy checklist

- [ ] `npm run build` passes locally  
- [ ] Env vars set on host (never commit real keys)  
- [ ] Migration SQL applied on Supabase (mode B)  
- [ ] Admin phone tested (register → `/admin`)  
- [ ] Farmer: create listing with photo  
- [ ] Buyer: browse → contact (WhatsApp / call)  
- [ ] Production build has **no** service role key  

---

## Local production smoke test

```bash
cp .env.example .env.local
# fill Supabase URL + anon + DATA_SOURCE=supabase + ADMIN_PHONE

npm run build
npm start
# open http://localhost:3000
```

---

## Cost notes (typical thesis/demo)

- **Vercel Hobby**: free for small Next.js apps  
- **Supabase free tier**: enough for demo/defense (watch DB + storage limits)  
- Custom domain: optional on both platforms  

When you outgrow free tiers, upgrade Supabase (or self-host Postgres) without rewriting UI — only repository internals and env change.
