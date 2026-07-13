# Part B — Full cutover guide

## 1. Local Supabase (recommended first)

```bash
# Install CLI: https://supabase.com/docs/guides/cli
supabase start
supabase db reset          # applies migrations/*.sql + seed.sql
```

Copy API URL + anon key from `supabase status` into `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

```bash
npm run seed:supabase      # demo users + 12 listings + categories + transport
npm run dev
```

## 2. Hosted project

1. Create project in Supabase Dashboard  
2. `supabase link --project-ref <ref>`  
3. `supabase db push`  *(or paste `supabase/full_migration.sql` into SQL Editor)*  
4. Set Vercel/hosting env vars (anon only in Next.js; never service role)  
5. `NEXT_PUBLIC_DATA_SOURCE=supabase`  
6. Run the seed script locally with the **service role key** to populate the catalogue:

```bash
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API>
npm run seed:supabase
```

Output:

```
✓ Seed complete
  categories:      8
  transport:       3
  users:           4
  listings:        12
  demo password:   password123

Demo logins (phone, password123):
  08010000001     admin    Admin NAUB
  08031112222     farmer   Musa Ibrahim
  08033334444     farmer   Aisha Bello
  08037778888     buyer    Fatima Sani
```

The script is idempotent: re-running it upserts categories + users and replaces the product listings. You can run it any time to reset the catalogue.  

## 3. Smoke tests after cutover

| Flow | Expect |
|------|--------|
| Register farmer | Profile row + pending verification |
| Admin verifies farmer | Can create listings |
| Create listing + photo | Storage path under `{uid}/…` |
| Buyer contact WhatsApp | `contact_requests` row |
| Complete contact + review | Rating on profile (trigger) |
| Past-expiry product | `archive_expired_listings()` or client archive |

## 4. Security checklist (B7)

- [ ] RLS enabled on all tables (`0002_rls.sql`)  
- [ ] Direct REST call as buyer cannot update another farmer’s product  
- [ ] Production build bundle has **no** `service_role` string  
- [ ] Storage folder policy: only own `auth.uid()` prefix  
- [ ] Auth rate limits: Supabase defaults + monitor abuse  
- [ ] **Email confirmation turned OFF** in Supabase → Authentication → Providers → Email — required for this phone-first app, see [deployment.md §5](./deployment.md)

## 5. Rollback

Set `NEXT_PUBLIC_DATA_SOURCE=local` and redeploy — UI/services unchanged; localStorage prototype returns.
