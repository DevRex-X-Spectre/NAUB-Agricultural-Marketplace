-- B6: Daily price history snapshot (call via pg_cron or Edge Function)

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

-- Optional: enable pg_cron on hosted Supabase and schedule:
-- select cron.schedule(
--   'snapshot-category-prices',
--   '0 1 * * *',
--   'select public.snapshot_category_prices()'
-- );
-- select cron.schedule(
--   'archive-expired-listings',
--   '0 * * * *',
--   'select public.archive_expired_listings()'
-- );
