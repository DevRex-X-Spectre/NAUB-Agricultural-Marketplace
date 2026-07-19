"use client";

import {
  ListingForm,
  type ListingFormValues,
} from "@/components/marketplace/listing-form";
import { useAuth } from "@/components/providers/auth-provider";
import { useSystemAlert } from "@/components/providers/system-alert-provider";
import { Button } from "@/components/ui/button";
import { productService } from "@/lib/services";
import type { Product } from "@/lib/types";
import { sameId } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditListingPage() {
  const { user } = useAuth();
  const { confirm } = useSystemAlert();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productService.getById(id).then((res) => {
      if (res.success && res.data) setProduct(res.data);
      else setError(res.error ?? "Not found");
    });
  }, [id]);

  if (!user) return null;

  async function handleSubmit(values: ListingFormValues) {
    if (!user) return "Not signed in";
    const res = await productService.update(id, user.id, {
      name: values.name,
      category_id: values.category_id,
      description: values.description,
      price: values.price,
      unit: values.unit,
      quantity: values.quantity,
      expiry_date: values.expiry_date,
      lga: values.lga,
      image_path: values.image_path,
      status: values.status,
    });
    if (!res.success) return res.error ?? "Update failed";
    router.push("/farmer/listings");
    return null;
  }

  async function handleDelete() {
    if (!user) return;
    const confirmed = await confirm({
      title: "Delete listing?",
      message:
        "This listing will be permanently removed from the marketplace. This action cannot be undone.",
      confirmLabel: "Delete listing",
      variant: "danger",
    });
    if (!confirmed) return;
    const res = await productService.delete(id, user.id);
    if (res.success) router.push("/farmer/listings");
    else setError(res.error ?? "Delete failed");
  }

  if (error && !product) {
    return <p className="text-body">{error}</p>;
  }
  if (!product) {
    return <p className="text-body text-forest-canopy/70">Loading…</p>;
  }
  if (!sameId(product.farmer_id, user.id)) {
    return <p className="text-body">You can only edit your own listings.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/farmer/listings"
            className="text-body-sm text-forest-canopy/70 hover:underline"
          >
            ← Inventory
          </Link>
          <h1 className="mt-2 text-heading font-light tracking-[-0.8px]">
            Edit listing
          </h1>
        </div>
        <Button variant="secondary" onClick={() => void handleDelete()}>
          Delete
        </Button>
      </div>
      <ListingForm
        defaultLga={user.lga}
        farmerId={user.id}
        submitLabel="Save changes"
        showStatus
        initial={{
          name: product.name,
          category_id: product.category_id,
          description: product.description,
          price: product.price,
          unit: product.unit,
          quantity: product.quantity,
          expiry_date: product.expiry_date,
          lga: product.lga,
          image_path: product.image_path,
          status: product.status,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
