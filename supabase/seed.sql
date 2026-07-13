-- Categories seed (run after migrations). Auth users must be created via Auth API/seed script.
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

insert into public.transport_providers (name, phone, coverage_lga, notes) values
  ('Biu Express Logistics', '08051234567', 'Biu, Hawul, Kwaya Kusar', 'Pick-up from farm gate. Bags and crates.'),
  ('Sahel Haulage Co.', '08059876543', 'Maiduguri, Jere, Konduga', 'Livestock trailers available on request.'),
  ('Green Corridor Transporters', '08055551234', 'Biu, Shani, Bayo, Askira/Uba', 'Same-day Biu market runs. Call before 7am.');
