#!/usr/bin/env node
/**
 * Print the exact Cloudinary env-var setup required for this project.
 *
 * - Reads NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 *   from the current process and reports whether they are set.
 * - NEVER reads the API key or API secret — those are server-only.
 *
 * Usage:
 *   node scripts/cloudinary-check.mjs
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  // Minimal .env parser — no third-party deps
  readFile(envPath, "utf8").then((raw) => {
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, name, value] = m;
      if (!(name in process.env)) {
        process.env[name] = value.replace(/^['"]|['"]$/g, "");
      }
    }
  });
}

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

console.log("\nNAUB Agric Connect — Cloudinary env check\n");

function row(label, value, ok) {
  const status = ok ? "✅" : "❌";
  const display = value ? value : "(not set)";
  console.log(`  ${status}  ${label.padEnd(44)}  ${display}`);
}

row("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", CLOUD, Boolean(CLOUD));
row("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET", PRESET, Boolean(PRESET));

console.log(
  "\n  🔒  CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are server-only."
);
console.log(
  "      Do NOT prefix with NEXT_PUBLIC_ or they will ship to the browser.\n"
);

const allOk = CLOUD && PRESET;
if (allOk) {
  console.log("✅ Cloudinary looks configured. Listing photos will upload there.\n");
  console.log("Local photo fallback (Supabase Storage, then base64) is unused.\n");
} else {
  console.log("⚠️  Cloudinary is not fully configured.\n");
  console.log("Two ways to fix it:\n");
  console.log("  1. Cloudinary dashboard:");
  console.log("       Settings → Upload → Upload presets → Add");
  console.log("         Signing mode: Unsigned");
  console.log("         Folder:      naub-agri/listings");
  console.log("       Save. Note the preset name.\n");
  console.log("  2. Vercel project Settings → Environment Variables:");
  console.log("       NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME     = dalzi79v7");
  console.log("       NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  = naub_listings   (or whatever you named it)");
  console.log("     Redeploy.\n");
  console.log("Or, to skip Cloudinary entirely (uses Supabase Storage instead):");
  console.log("       Leave both values empty in Vercel.\n");
}

if (process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET) {
  console.error(
    "\n❌ FATAL: NEXT_PUBLIC_CLOUDINARY_API_SECRET is set — that would expose your secret. Remove the NEXT_PUBLIC_ prefix and rotate the key in the Cloudinary dashboard.\n"
  );
  process.exit(1);
}

process.exit(allOk ? 0 : 1);
