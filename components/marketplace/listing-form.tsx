"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LGA_OPTIONS } from "@/lib/config";
import {
  getImageUploadBackend,
  imageBackendLabel,
  prepareListingImage,
} from "@/lib/media/prepare-listing-image";
import { categoryRepository } from "@/lib/repositories";
import type { Category, Product, UserId } from "@/lib/types";
import { ImagePlus, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

export type ListingFormValues = {
  name: string;
  category_id: number;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  expiry_date: string;
  lga: string;
  image_path: string | null;
  status?: Product["status"];
};

type Props = {
  initial?: Partial<ListingFormValues>;
  defaultLga: string;
  farmerId: UserId;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => Promise<string | null>;
  showStatus?: boolean;
};

const UNITS = [
  "bag",
  "kg",
  "mudu",
  "crate",
  "basket",
  "bundle",
  "bird",
  "head",
  "litre",
  "unit",
];

export function ListingForm({
  initial,
  defaultLga,
  farmerId,
  submitLabel,
  onSubmit,
  showStatus,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    String(initial?.category_id ?? "")
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [unit, setUnit] = useState(initial?.unit ?? "bag");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? ""));
  const [expiry, setExpiry] = useState(initial?.expiry_date ?? "");
  const [lga, setLga] = useState(initial?.lga ?? defaultLga);
  const [imagePath, setImagePath] = useState<string | null>(
    initial?.image_path ?? null
  );
  const [status, setStatus] = useState<Product["status"]>(
    initial?.status ?? "active"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadBackend = useMemo(() => getImageUploadBackend(), []);
  const backendHint = useMemo(
    () => imageBackendLabel(uploadBackend),
    [uploadBackend]
  );

  useEffect(() => {
    categoryRepository.findAll().then(setCategories);
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, or WebP)");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const path = await prepareListingImage(farmerId, file);
      setImagePath(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const err = await onSubmit({
        name,
        category_id: Number(categoryId),
        description,
        price: Number(price),
        unit,
        quantity: Number(quantity),
        expiry_date: expiry,
        lga,
        image_path: imagePath,
        status,
      });
      if (err) setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <Input
        label="Product name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        placeholder="Select category"
        options={categories.map((c) => ({
          value: String(c.id),
          label: c.name,
        }))}
        required
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Price (NGN)"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <Select
          label="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          options={UNITS.map((u) => ({ value: u, label: u }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Quantity"
          type="number"
          min={0}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <Input
          label="Expiry date"
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          required
        />
      </div>
      <Select
        label="LGA"
        value={lga}
        onChange={(e) => setLga(e.target.value)}
        options={LGA_OPTIONS.map((x) => ({ value: x, label: x }))}
      />

      {showStatus ? (
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Product["status"])}
          options={[
            { value: "active", label: "Active" },
            { value: "sold", label: "Sold" },
            { value: "expired", label: "Expired" },
            { value: "flagged", label: "Flagged" },
          ]}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium">Product photo</span>
        <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-forest-canopy/25 bg-pale-stone/50 px-4 py-6 text-center transition-colors hover:bg-pale-stone">
          {uploading ? (
            <Loader2
              className="h-8 w-8 animate-spin text-forest-canopy/70"
              aria-hidden
            />
          ) : (
            <ImagePlus
              className="h-8 w-8 text-forest-canopy/60"
              aria-hidden
            />
          )}
          <span className="text-body-sm font-medium text-forest-canopy">
            {uploading
              ? uploadBackend === "supabase"
                ? "Uploading to Supabase…"
                : "Preparing photo…"
              : imagePath
                ? "Change photo"
                : "Tap to add photo"}
          </span>
          <span className="text-[12px] text-forest-canopy/55">
            Camera or gallery · compressed for mobile data
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="environment"
            disabled={uploading}
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="text-body-sm text-forest-canopy/60">{backendHint}</p>
        {imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePath}
            alt="Listing preview"
            className="mt-1 max-h-48 w-full rounded-2xl object-cover"
          />
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-pale-stone px-3 py-3 text-body-sm"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting || uploading}
        className="w-full sm:w-auto"
      >
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
