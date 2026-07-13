/**
 * Supabase bootstrap — categories, transport providers, demo users, and
 * demo product listings. Safe to re-run: existing users are matched by
 * email (and profiles upserted); categories and transport providers are
 * upserted; products are cleared and re-inserted.
 *
 * Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 * Optional: ADMIN_PHONE — phone number to promote to admin role on seed.
 * Run: npm run seed:supabase
 *
 * NEVER run this with the anon key — the service role key bypasses RLS.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPhone =
  process.env.ADMIN_PHONE || process.env.NEXT_PUBLIC_ADMIN_PHONE || "08010000001";

if (!url || !serviceKey) {
  console.error(
    "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "password123";

function daysFromNow(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
}

const CATEGORIES = [
  { name: "Maize", icon: "maize", slug: "maize" },
  { name: "Sorghum", icon: "sorghum", slug: "sorghum" },
  { name: "Millet", icon: "millet", slug: "millet" },
  { name: "Groundnuts", icon: "groundnuts", slug: "groundnuts" },
  { name: "Livestock", icon: "livestock", slug: "livestock" },
  { name: "Poultry", icon: "poultry", slug: "poultry" },
  { name: "Dairy", icon: "dairy", slug: "dairy" },
  { name: "Vegetables", icon: "vegetables", slug: "vegetables" },
];

const TRANSPORT = [
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
];

const USERS = [
  {
    email: "admin@naub-agri.local",
    phone: adminPhone,
    full_name: "Admin NAUB",
    lga: "Biu",
    role: "admin",
  },
  {
    email: "musa.ibrahim@demo.naub-agri.local",
    phone: "08031112222",
    full_name: "Musa Ibrahim",
    lga: "Biu",
    role: "farmer",
  },
  {
    email: "aisha.bello@demo.naub-agri.local",
    phone: "08033334444",
    full_name: "Aisha Bello",
    lga: "Hawul",
    role: "farmer",
  },
  {
    email: "fatima.sani@demo.naub-agri.local",
    phone: "08037778888",
    full_name: "Fatima Sani",
    lga: "Maiduguri",
    role: "buyer",
  },
];

const PRODUCTS = [
  {
    farmerPhone: "08031112222",
    categorySlug: "maize",
    name: "White Maize, 50kg bags",
    description:
      "Dry white maize from Biu farms. Clean, ready for mill. Minimum 5 bags.",
    price: 28000,
    unit: "bag",
    quantity: 40,
    expiry_offset_days: 45,
    image_path: "/demo-images/maize/1.jpg",
    lga: "Biu",
  },
  {
    farmerPhone: "08031112222",
    categorySlug: "groundnuts",
    name: "Shelled Groundnuts",
    description: "Grade A shelled groundnuts, sun-dried. Ideal for oil mills.",
    price: 15000,
    unit: "mudu",
    quantity: 80,
    expiry_offset_days: 60,
    image_path: "/demo-images/groundnuts/1.jpg",
    lga: "Biu",
  },
  {
    farmerPhone: "08033334444",
    categorySlug: "sorghum",
    name: "Red Sorghum Grain",
    description:
      "Freshly harvested red sorghum. Good for animal feed and brewing.",
    price: 22000,
    unit: "bag",
    quantity: 25,
    expiry_offset_days: 30,
    image_path: "/demo-images/sorghum/1.jpg",
    lga: "Hawul",
  },
  {
    farmerPhone: "08033334444",
    categorySlug: "poultry",
    name: "Live Broilers (8 weeks)",
    description: "Healthy broilers ready for market. Sold per bird.",
    price: 4500,
    unit: "bird",
    quantity: 60,
    expiry_offset_days: 7,
    image_path: "/demo-images/poultry/1.jpg",
    lga: "Hawul",
  },
  {
    farmerPhone: "08031112222",
    categorySlug: "livestock",
    name: "Sokoto Red Goats",
    description: "Healthy goats, vaccinated. Suitable for breeding or meat.",
    price: 45000,
    unit: "head",
    quantity: 8,
    expiry_offset_days: 90,
    image_path: "/demo-images/goats/1.jpg",
    lga: "Biu",
  },
  {
    farmerPhone: "08033334444",
    categorySlug: "vegetables",
    name: "Fresh Tomatoes, crates",
    description:
      "Ripe tomatoes from Hawul gardens. Best collected same day.",
    price: 12000,
    unit: "crate",
    quantity: 15,
    expiry_offset_days: 3,
    image_path: "/demo-images/tomatoes/1.jpg",
    lga: "Hawul",
  },
  {
    farmerPhone: "08031112222",
    categorySlug: "dairy",
    name: "Fresh Cow Milk",
    description: "Morning-milked fresh milk. Bring own containers.",
    price: 800,
    unit: "litre",
    quantity: 40,
    expiry_offset_days: 1,
    image_path: "/demo-images/dairy/1.jpg",
    lga: "Biu",
  },
  {
    farmerPhone: "08033334444",
    categorySlug: "vegetables",
    name: "Hot Peppers (shombo)",
    description: "Fresh hot peppers, sorted. Ideal for market traders.",
    price: 5000,
    unit: "basket",
    quantity: 20,
    expiry_offset_days: 5,
    image_path: "/demo-images/peppers/1.jpg",
    lga: "Hawul",
  },
  {
    farmerPhone: "08031112222",
    categorySlug: "millet",
    name: "Pearl Millet Grain",
    description: "Clean pearl millet for household and commercial use.",
    price: 18000,
    unit: "bag",
    quantity: 12,
    expiry_offset_days: 40,
    image_path: "/demo-images/millet/1.jpg",
    lga: "Biu",
  },
  {
    farmerPhone: "08033334444",
    categorySlug: "livestock",
    name: "White Fulani Cattle (steer)",
    description:
      "Well-fed steer, good condition. Inspection welcome at farm.",
    price: 280000,
    unit: "head",
    quantity: 2,
    expiry_offset_days: 120,
    image_path: "/demo-images/cattle/1.jpg",
    lga: "Hawul",
  },
  {
    farmerPhone: "08031112222",
    categorySlug: "maize",
    name: "Yellow Maize, bulk bags",
    description: "Yellow maize suitable for feed mills. Discount on 20+ bags.",
    price: 26500,
    unit: "bag",
    quantity: 30,
    expiry_offset_days: 50,
    image_path: "/demo-images/maize/2.jpg",
    lga: "Biu",
  },
  {
    farmerPhone: "08033334444",
    categorySlug: "vegetables",
    name: "Leafy greens, mixed bundles",
    description: "Fresh garden greens. Morning harvest only.",
    price: 1500,
    unit: "bundle",
    quantity: 50,
    expiry_offset_days: 2,
    image_path: "/demo-images/vegetables/1.jpg",
    lga: "Hawul",
  },
];

async function upsertCategories() {
  for (const c of CATEGORIES) {
    const { error } = await admin.from("categories").upsert(c, {
      onConflict: "slug",
    });
    if (error) console.warn("category", c.slug, error.message);
  }
  const { data } = await admin.from("categories").select("id, slug");
  const bySlug = new Map((data ?? []).map((c) => [c.slug, c.id]));
  console.log(`categories upserted: ${bySlug.size}`);
  return bySlug;
}

async function upsertTransport() {
  await admin.from("transport_providers").delete().neq("id", 0);
  const { error } = await admin.from("transport_providers").insert(TRANSPORT);
  if (error) console.warn("transport", error.message);
  else console.log(`transport providers inserted: ${TRANSPORT.length}`);
}

async function ensureDemoUser(spec) {
  // Service role can list users by email
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.warn("list users:", listErr.message);
    return null;
  }
  let user = list.users.find((u) => u.email?.toLowerCase() === spec.email);
  if (!user) {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: spec.email,
        password: DEMO_PASSWORD,
        email_confirm: true, // skip the confirmation flow for seed users
        user_metadata: {
          full_name: spec.full_name,
          phone: spec.phone,
          role: spec.role,
          lga: spec.lga,
        },
      });
    if (createErr) {
      console.warn("create user", spec.email, createErr.message);
      return null;
    }
    user = created.user;
    console.log("created auth user:", spec.email);
  } else {
    console.log("auth user exists:", spec.email);
  }

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: spec.full_name,
      phone: spec.phone,
      email: spec.email,
      lga: spec.lga,
      role: spec.role,
      verification_status: "verified",
      average_rating: spec.role === "farmer" ? 4.5 : 0,
      review_count: 0,
    },
    { onConflict: "id" }
  );
  if (profileErr) console.warn("profile", spec.email, profileErr.message);

  return user.id;
}

async function insertProducts(categoryIds, userIdsByPhone) {
  // Wipe existing listings (FKs cascade)
  await admin.from("products").delete().neq("id", 0);

  const now = new Date().toISOString();
  const rows = PRODUCTS.map((p) => {
    const farmer_id = userIdsByPhone.get(p.farmerPhone);
    const category_id = categoryIds.get(p.categorySlug);
    if (!farmer_id) {
      throw new Error(`unknown farmer phone ${p.farmerPhone}`);
    }
    if (!category_id) {
      throw new Error(`unknown category slug ${p.categorySlug}`);
    }
    return {
      farmer_id,
      category_id,
      name: p.name,
      description: p.description,
      price: p.price,
      unit: p.unit,
      quantity: p.quantity,
      expiry_date: daysFromNow(p.expiry_offset_days),
      status: "active",
      image_path: p.image_path,
      lga: p.lga,
      created_at: now,
      updated_at: now,
    };
  });

  const { error } = await admin.from("products").insert(rows);
  if (error) {
    console.warn("products insert:", error.message);
    return 0;
  }
  console.log(`products inserted: ${rows.length}`);
  return rows.length;
}

async function main() {
  console.log("Seeding Supabase:", url);

  const categoryIds = await upsertCategories();
  await upsertTransport();

  // Users — create auth.users + profiles
  const userIdsByPhone = new Map();
  for (const spec of USERS) {
    const id = await ensureDemoUser(spec);
    if (id) userIdsByPhone.set(spec.phone, id);
  }
  console.log(`users ensured: ${userIdsByPhone.size}`);

  const productCount = await insertProducts(categoryIds, userIdsByPhone);

  console.log("\n✓ Seed complete");
  console.log(`  categories:      ${categoryIds.size}`);
  console.log(`  transport:       ${TRANSPORT.length}`);
  console.log(`  users:           ${userIdsByPhone.size}`);
  console.log(`  listings:        ${productCount}`);
  console.log(`  demo password:   ${DEMO_PASSWORD}`);
  console.log("\nDemo logins (phone, password123):");
  for (const u of USERS) {
    console.log(`  ${u.phone.padEnd(14)} ${u.role.padEnd(8)} ${u.full_name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});