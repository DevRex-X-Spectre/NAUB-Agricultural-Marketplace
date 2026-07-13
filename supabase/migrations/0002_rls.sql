-- Part B3: Row Level Security policies

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.contact_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.price_history enable row level security;
alter table public.transport_providers enable row level security;

-- Helper: is admin
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

-- profiles
create policy "public read profiles basic"
  on public.profiles for select
  using (true);

create policy "users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins update any profile"
  on public.profiles for update
  using (public.is_admin());

-- categories
create policy "public read categories"
  on public.categories for select using (true);

create policy "admins write categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- products
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

-- contact_requests
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

-- reviews
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

-- price_history & transport
create policy "public read price_history"
  on public.price_history for select using (true);

create policy "public read transport"
  on public.transport_providers for select using (true);

create policy "admins write transport"
  on public.transport_providers for all
  using (public.is_admin())
  with check (public.is_admin());
