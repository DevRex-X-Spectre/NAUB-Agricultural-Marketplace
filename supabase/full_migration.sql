-- =============================================================================
-- NAUB Agricultural Marketplace — FULL Supabase migration (run once)
-- =============================================================================
-- How to run:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--   3. (Optional) promote an admin after they register — see bottom of file
--
-- Safe for a NEW project. If types/tables already exist, drop them first or use
-- a fresh Supabase project. For CLI: use supabase/migrations/*.sql instead.
-- =============================================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type user_role as enum ('farmer', 'buyer', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type verification_status as enum ('pending', 'verified', 'suspended', 'banned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type listing_status as enum ('active', 'sold', 'expired', 'flagged');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type contact_method as enum ('whatsapp', 'call');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type request_status as enum ('sent', 'completed');
exception when duplicate_object then null;
end $$;

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  lga text not null,
  role user_role not null,
  verification_status verification_status not null default 'pending',
  average_rating numeric(3,1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create unique index if not exists profiles_phone_key on public.profiles (phone);

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  icon text,
  slug text not null unique
);

create table if not exists public.products (
  id bigint generated always as identity primary key,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint not null references public.categories(id),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  unit text not null,
  quantity numeric(12,2) not null check (quantity >= 0),
  expiry_date date not null,
  status listing_status not null default 'active',
  image_path text,
  lga text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id bigint generated always as identity primary key,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  method contact_method not null,
  status request_status not null default 'sent',
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (buyer_id, product_id)
);

create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id),
  avg_price numeric(12,2) not null,
  recorded_on date not null default current_date
);

create table if not exists public.transport_providers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  coverage_lga text,
  notes text
);

create index if not exists idx_products_farmer on public.products(farmer_id);
create index if not exists idx_products_category_status on public.products(category_id, status);
create index if not exists idx_products_expiry on public.products(expiry_date) where status = 'active';
create index if not exists idx_contact_requests_farmer on public.contact_requests(farmer_id);
create index if not exists idx_reviews_farmer on public.reviews(farmer_id);

-- ─── Auth → profile trigger ──────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, phone, lga, role, email, verification_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'phone', new.phone, ''),
    coalesce(new.raw_user_meta_data->>'lga', 'Other'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'),
    new.email,
    'verified'::verification_status
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── FR-09 archive expired listings ──────────────────────────────────────────

create or replace function public.archive_expired_listings()
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
  set status = 'expired', updated_at = now()
  where status = 'active' and expiry_date < current_date;
$$;

-- ─── FR-06 rating recompute ──────────────────────────────────────────────────

create or replace function public.recompute_farmer_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  avg_r numeric(3,1);
  cnt integer;
begin
  fid := coalesce(new.farmer_id, old.farmer_id);
  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)
    into avg_r, cnt
  from public.reviews
  where farmer_id = fid;

  update public.profiles
  set average_rating = avg_r, review_count = cnt
  where id = fid;

  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recompute_rating on public.reviews;
create trigger reviews_recompute_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_farmer_rating();

-- ─── FR-10 price snapshots ───────────────────────────────────────────────────

create or replace function public.snapshot_category_prices()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.price_history (category_id, avg_price, recorded_on)
  select
    category_id,
    round(avg(price)::numeric, 2),
    current_date
  from public.products
  where status = 'active'
  group by category_id;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.contact_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.price_history enable row level security;
alter table public.transport_providers enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop policies if re-running
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "public read profiles basic"
  on public.profiles for select using (true);

create policy "users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins update any profile"
  on public.profiles for update
  using (public.is_admin());

create policy "public read categories"
  on public.categories for select using (true);

create policy "admins write categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "public view active or own products"
  on public.products for select
  using (
    status = 'active'
    or farmer_id = auth.uid()
    or public.is_admin()
  );

create policy "verified farmers create listings"
  on public.products for insert
  with check (
    farmer_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'farmer'
        and verification_status = 'verified'
    )
  );

create policy "farmers update own listings"
  on public.products for update
  using (farmer_id = auth.uid() or public.is_admin());

create policy "farmers delete own listings"
  on public.products for delete
  using (farmer_id = auth.uid() or public.is_admin());

create policy "buyers insert own contacts"
  on public.contact_requests for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'buyer'
    )
  );

create policy "parties read own contacts"
  on public.contact_requests for select
  using (
    buyer_id = auth.uid()
    or farmer_id = auth.uid()
    or public.is_admin()
  );

create policy "parties complete contacts"
  on public.contact_requests for update
  using (buyer_id = auth.uid() or farmer_id = auth.uid() or public.is_admin());

create policy "public read reviews"
  on public.reviews for select using (true);

create policy "buyers insert review after completed contact"
  on public.reviews for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.contact_requests cr
      where cr.buyer_id = auth.uid()
        and cr.product_id = product_id
        and cr.farmer_id = farmer_id
        and cr.status = 'completed'
    )
  );

create policy "public read price_history"
  on public.price_history for select using (true);

create policy "public read transport"
  on public.transport_providers for select using (true);

create policy "admins write transport"
  on public.transport_providers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Storage: product-images ─────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read product images" on storage.objects;
drop policy if exists "farmers upload own product images" on storage.objects;
drop policy if exists "farmers update own product images" on storage.objects;
drop policy if exists "farmers delete own product images" on storage.objects;

create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "farmers upload own product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'farmer'
        and verification_status = 'verified'
    )
  );

create policy "farmers update own product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "farmers delete own product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── Taxonomy seed only (no users, no product listings) ──────────────────────

insert into public.categories (name, icon, slug) values
  ('Maize', 'maize', 'maize'),
  ('Sorghum', 'sorghum', 'sorghum'),
  ('Millet', 'millet', 'millet'),
  ('Groundnuts', 'groundnuts', 'groundnuts'),
  ('Livestock', 'livestock', 'livestock'),
  ('Poultry', 'poultry', 'poultry'),
  ('Dairy', 'dairy', 'dairy'),
  ('Vegetables', 'vegetables', 'vegetables')
on conflict (name) do nothing;

insert into public.transport_providers (name, phone, coverage_lga, notes)
select * from (values
  ('Biu Express Logistics', '08051234567', 'Biu, Hawul, Kwaya Kusar', 'Pick-up from farm gate. Bags and crates.'),
  ('Sahel Haulage Co.', '08059876543', 'Maiduguri, Jere, Konduga', 'Livestock trailers available on request.'),
  ('Green Corridor Transporters', '08055551234', 'Biu, Shani, Bayo, Askira/Uba', 'Same-day Biu market runs. Call before 7am.')
) as v(name, phone, coverage_lga, notes)
where not exists (select 1 from public.transport_providers limit 1);

-- ─── Optional: clear marketplace listings (safe anytime) ─────────────────────
-- Uncomment to wipe products/contacts/reviews without dropping schema:
/*
truncate table public.reviews restart identity cascade;
truncate table public.contact_requests restart identity cascade;
truncate table public.price_history restart identity cascade;
truncate table public.products restart identity cascade;
*/

-- ─── Optional: promote a registered user to admin ────────────────────────────
-- After someone registers in the app, run (replace phone):
/*
update public.profiles
set role = 'admin', verification_status = 'verified'
where phone = '0803XXXXXXX';
*/
