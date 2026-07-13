/**
 * Minimal Supabase bootstrap — categories + logistics only.
 * Does NOT create demo users or product listings.
 *
 * Users self-register via the app (Auth + profiles trigger).
 *
 * Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run seed:supabase
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Clear marketplace transactional data (keeps Auth users if any)
  for (const table of [
    "reviews",
    "contact_requests",
    "price_history",
    "products",
  ]) {
    const { error } = await admin.from(table).delete().neq("id", 0);
    if (error) console.warn(`clear ${table}:`, error.message);
    else console.log(`cleared ${table}`);
  }

  const categories = [
    { name: "Maize", icon: "maize", slug: "maize" },
    { name: "Sorghum", icon: "sorghum", slug: "sorghum" },
    { name: "Millet", icon: "millet", slug: "millet" },
    { name: "Groundnuts", icon: "groundnuts", slug: "groundnuts" },
    { name: "Livestock", icon: "livestock", slug: "livestock" },
    { name: "Poultry", icon: "poultry", slug: "poultry" },
    { name: "Dairy", icon: "dairy", slug: "dairy" },
    { name: "Vegetables", icon: "vegetables", slug: "vegetables" },
  ];

  for (const c of categories) {
    const { error } = await admin.from("categories").upsert(c, {
      onConflict: "name",
    });
    if (error) console.warn("category", c.slug, error.message);
  }
  console.log("categories upserted:", categories.length);

  await admin.from("transport_providers").delete().neq("id", 0);
  const { error: tErr } = await admin.from("transport_providers").insert([
    {
      name: "Biu Express Logistics",
      phone: "08051234567",
      coverage_lga: "Biu, Hawul, Kwaya Kusar",
      notes: "Pick-up from farm gate. Bags and crates.",
    },
    {
      name: "Sahel Haulage Co.",
      phone: "08059876543",
      coverage_lga: "Maiduguri, Jere, Konduga",
      notes: "Livestock trailers available on request.",
    },
    {
      name: "Green Corridor Transporters",
      phone: "08055551234",
      coverage_lga: "Biu, Shani, Bayo, Askira/Uba",
      notes: "Same-day Biu market runs. Call before 7am.",
    },
  ]);
  if (tErr) console.warn("transport", tErr.message);
  else console.log("transport providers ready");

  console.log(
    "\nDone. No demo users/listings. Open the app → Register → Sign in → List or browse."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
