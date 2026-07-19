/**
 * Unified listing image pipeline.
 * Priority:
 *  1. Supabase Storage (when DATA_SOURCE=supabase)
 *  2. Base64 data URL — local prototype only
 */

import { isSupabase } from "@/lib/config";
import {
  fileToDataUrl,
  uploadProductImage as uploadToSupabase,
} from "@/lib/supabase/storage";
import type { UserId } from "@/lib/types";

export type ImageUploadBackend = "supabase" | "local";

export function getImageUploadBackend(): ImageUploadBackend {
  if (isSupabase) return "supabase";
  return "local";
}

export async function prepareListingImage(
  farmerId: UserId,
  file: File
): Promise<string> {
  const backend = getImageUploadBackend();

  if (backend === "supabase") {
    const { publicUrl } = await uploadToSupabase(farmerId, file);
    return publicUrl;
  }

  // Local prototype fallback — not durable across devices
  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error(
      "Image must be under 1.5 MB in local demo mode. Switch to Supabase for durable uploads."
    );
  }
  return fileToDataUrl(file);
}

export function imageBackendLabel(backend: ImageUploadBackend): string {
  switch (backend) {
    case "supabase":
      return "Photos upload to Supabase Storage.";
    default:
      return "Photo stored only in this browser (demo). Switch to Supabase for durable uploads.";
  }
}
