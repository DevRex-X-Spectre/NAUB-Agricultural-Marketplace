/**
 * Unified listing image pipeline.
 * Priority:
 *  1. Cloudinary (when env is set) — primary production path for photos
 *  2. Supabase Storage (when DATA_SOURCE=supabase and Cloudinary off)
 *  3. Base64 data URL — last-resort local prototype only
 */

import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { isSupabase } from "@/lib/config";
import {
  fileToDataUrl,
  uploadProductImage as uploadToSupabase,
} from "@/lib/supabase/storage";
import type { UserId } from "@/lib/types";

export type ImageUploadBackend = "cloudinary" | "supabase" | "local";

export function getImageUploadBackend(): ImageUploadBackend {
  if (isCloudinaryConfigured()) return "cloudinary";
  if (isSupabase) return "supabase";
  return "local";
}

export async function prepareListingImage(
  farmerId: UserId,
  file: File
): Promise<string> {
  const backend = getImageUploadBackend();

  if (backend === "cloudinary") {
    const result = await uploadToCloudinary(farmerId, file);
    return result.secure_url;
  }

  if (backend === "supabase") {
    const { publicUrl } = await uploadToSupabase(farmerId, file);
    return publicUrl;
  }

  // Local prototype fallback — not durable across devices
  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error(
      "Image must be under 1.5 MB without Cloudinary. Configure Cloudinary for full uploads."
    );
  }
  return fileToDataUrl(file);
}

export function imageBackendLabel(backend: ImageUploadBackend): string {
  switch (backend) {
    case "cloudinary":
      return "Photos upload to Cloudinary (optimized for mobile).";
    case "supabase":
      return "Photos upload to Supabase Storage.";
    default:
      return "Cloudinary not configured. Photo stored only in this browser (demo). Set NEXT_PUBLIC_CLOUDINARY_* for real uploads.";
  }
}
