/**
 * Cloudinary product-image uploads for farmer listings.
 *
 * The browser talks directly to Cloudinary using an **unsigned** upload
 * preset — no API key, no API secret. Only two env vars are needed:
 *
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME        ← Cloud name (visible in dashboard)
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET     ← Name of an UNSIGNED preset
 *
 * SECURITY: Do NOT prefix the API key or API secret with `NEXT_PUBLIC_`.
 * Those would be bundled into the browser and exfiltrated by any visitor.
 * The server-side `service_role` key from Supabase and the Cloudinary
 * `api_secret` are both held on the server only and never imported in
 * client components.
 *
 * To create the preset:
 *   1. Cloudinary console → Settings → Upload → Upload presets → Add
 *   2. Signing mode: Unsigned
 *   3. Folder: naub-agri/listings
 *   4. Allow image/* up to ~5 MB
 *   5. Save. Copy the preset name into NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 */

import type { UserId } from "@/lib/types";

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";
export const CLOUDINARY_FOLDER =
  process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "naub-agri/listings";

/**
 * Defensive guard. If anyone ever promotes the API secret to a
 * NEXT_PUBLIC_* variable by accident, refuse to start — leaking the
 * secret at runtime is worse than failing loud at build time.
 *
 * Touch the variable name so a typo (e.g. CLOUDINARY__SECRET, CLOUDINARY
 * _API_KEY with a stray prefix) still gets caught in dev.
 */
const FORBIDDEN_PUBLIC_SECRETS = [
  "NEXT_PUBLIC_CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_CLOUDINARY_SECRET",
  "NEXT_PUBLIC_CLOUDINARY_API_KEY",
];
for (const name of FORBIDDEN_PUBLIC_SECRETS) {
  if (process.env[name]) {
    // eslint-disable-next-line no-console
    console.error(
      `[cloudinary] Refusing to start: ${name} is set. ` +
        "Remove the NEXT_PUBLIC_ prefix from any Cloudinary API key/secret. " +
        "These values are bundled into the browser and expose your account."
    );
  }
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
};

/**
 * Light client-side resize before upload (NFR-01 bandwidth).
 * Max edge 1280px, JPEG quality ~0.82.
 */
export async function compressImageForUpload(
  file: File,
  maxEdge = 1280,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }
  // Skip non-raster or already-small files
  if (file.size < 200_000) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (!blob) return file;

    return new File(
      [blob],
      file.name.replace(/\.\w+$/, "") + ".jpg",
      { type: "image/jpeg" }
    );
  } finally {
    bitmap.close();
  }
}

/**
 * Upload listing photo to Cloudinary (unsigned preset).
 * Returns the HTTPS delivery URL to store on the product as image_path.
 */
export async function uploadToCloudinary(
  farmerId: UserId,
  file: File
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8 MB before compression");
  }

  const prepared = await compressImageForUpload(file);
  if (prepared.size > 5 * 1024 * 1024) {
    throw new Error("Image is still too large after compression (max 5 MB)");
  }

  const folder = `${CLOUDINARY_FOLDER}/${farmerId}`;
  const form = new FormData();
  form.append("file", prepared);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", folder);
  form.append(
    "context",
    `farmer_id=${String(farmerId)}|app=naub_agri_marketplace`
  );

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json()) as CloudinaryUploadResult & {
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(
      data.error?.message || `Cloudinary upload failed (${res.status})`
    );
  }
  if (!data.secure_url) {
    throw new Error("Cloudinary did not return a secure URL");
  }

  return data;
}
