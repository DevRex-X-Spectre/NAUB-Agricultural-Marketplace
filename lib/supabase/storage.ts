/**
 * B4 — Product image uploads to Supabase Storage.
 * Bucket: product-images/{farmer_id}/{filename}
 */
import { PRODUCT_IMAGES_BUCKET, isSupabase } from "@/lib/config";
import type { UserId } from "@/lib/types";
import { getSupabaseBrowserClient } from "./client";

export async function uploadProductImage(
  farmerId: UserId,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  if (!isSupabase) {
    throw new Error("uploadProductImage requires DATA_SOURCE=supabase");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Image must be under 3 MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const path = `${farmerId}/${filename}`;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

/** Convert File → data URL for local prototype (Part A) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

