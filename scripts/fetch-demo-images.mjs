/**
 * One-time download of royalty-free demo images into public/demo-images/.
 * Sources: Unsplash (license: Unsplash License — free commercial use).
 *
 * Run: node scripts/fetch-demo-images.mjs
 */

import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outRoot = join(root, "public", "demo-images");

/**
 * Curated Unsplash photo IDs — agricultural / portrait subjects.
 * URLs use images.unsplash.com with w=800 for reasonable file size (NFR-01).
 */
const IMAGES = {
  maize: [
    "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
  ],
  sorghum: [
    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  ],
  millet: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
  ],
  groundnuts: [
    "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80",
    "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=800&q=80",
  ],
  cattle: [
    "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&q=80",
    "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80",
  ],
  goats: [
    "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&q=80",
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
  ],
  poultry: [
    "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80",
    "https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=800&q=80",
  ],
  dairy: [
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80",
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80",
  ],
  tomatoes: [
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80",
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80",
  ],
  peppers: [
    "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80",
    "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=800&q=80",
  ],
  vegetables: [
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  ],
  avatars: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  ],
};

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log("skip (exists)", dest);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  const res = await fetch(url, {
    headers: {
      "User-Agent": "naub-agri-marketplace-demo-image-fetch/1.0",
      Accept: "image/*",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  if (!res.body) {
    throw new Error(`No body for ${url}`);
  }
  await pipeline(res.body, createWriteStream(dest));
  console.log("saved", dest);
}

async function main() {
  mkdirSync(outRoot, { recursive: true });
  for (const [folder, urls] of Object.entries(IMAGES)) {
    for (let i = 0; i < urls.length; i++) {
      const dest = join(outRoot, folder, `${i + 1}.jpg`);
      try {
        await download(urls[i], dest);
      } catch (e) {
        console.error("failed", folder, i + 1, e.message);
      }
    }
  }
  console.log("Done. Images under public/demo-images/");
}

main();
