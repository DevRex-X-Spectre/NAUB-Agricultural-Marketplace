-- Part B1: Postgres schema matching Part A types / thesis §3.8
-- Apply with: supabase db reset  (or supabase migration up)

create type user_role as enum ('farmer', 'buyer', 'admin');
create type verification_status as enum ('pending', 'verified', 'suspended', 'banned');
create type listing_status as enum ('active', 'sold', 'expired', 'flagged');
create type contact_method as enum ('whatsapp', 'call');
create type request_status as enum ('sent', 'completed');

create table public.profiles (
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

create unique index profiles_phone_key on public.profiles (phone);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  icon text,
  slug text not null unique
);

create table public.products (
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
  unique (buyer_id, product_id)
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

create index idx_products_farmer on public.products(farmer_id);
create index idx_products_category_status on public.products(category_id, status);
create index idx_products_expiry on public.products(expiry_date) where status = 'active';
create index idx_contact_requests_farmer on public.contact_requests(farmer_id);
create index idx_reviews_farmer on public.reviews(farmer_id);

-- Auto profile on auth signup (B2)
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
    -- Farmers start verified so they can list without a pre-seeded admin
    'verified'::verification_status
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- FR-09 archive (B6)
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

-- FR-06 rating recompute (B6)
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

create trigger reviews_recompute_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_farmer_rating();
