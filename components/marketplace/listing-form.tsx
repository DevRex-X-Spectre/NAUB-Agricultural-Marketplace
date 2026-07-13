"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LGA_OPTIONS, isSupabase } from "@/lib/config";
import { categoryRepository } from "@/lib/repositories";
import { prepareListingImage } from "@/lib/supabase/storage";
import type { Category, Product, UserId } from "@/lib/types";
import { FormEvent, useEffect, useState } from "react";

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

  useEffect(() => {
    categoryRepository.findAll().then(setCategories);
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
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
        <span className="text-body-sm font-medium">Photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={uploading}
          className="block w-full text-body-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-pale-stone file:px-4 file:py-2 file:text-body-sm file:font-medium"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-body-sm text-forest-canopy/60">
          {isSupabase
            ? "Uploads to secure cloud storage (Supabase)."
            : "Stored locally for this prototype — switch DATA_SOURCE=supabase for cloud storage."}
        </p>
        {uploading ? (
          <p className="text-body-sm">Uploading image…</p>
        ) : null}
        {imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePath}
            alt="Preview"
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
