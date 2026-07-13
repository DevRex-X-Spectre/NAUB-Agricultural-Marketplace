"use client";

import {
  ListingForm,
  type ListingFormValues,
} from "@/components/marketplace/listing-form";
import { useAuth } from "@/components/providers/auth-provider";
import { productService } from "@/lib/services";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  async function handleSubmit(values: ListingFormValues) {
    if (!user) return "Not signed in";
    if (user.verification_status !== "verified") {
      return "Your account must be verified before you can create listings.";
    }
    const res = await productService.create({
      farmer_id: user.id,
      category_id: values.category_id,
      name: values.name,
      description: values.description,
      price: values.price,
      unit: values.unit,
      quantity: values.quantity,
      expiry_date: values.expiry_date,
      lga: values.lga,
      image_path: values.image_path,
    });
    if (!res.success) return res.error ?? "Could not create listing";
    router.push("/farmer/listings");
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/farmer/listings"
          className="text-body-sm text-forest-canopy/70 hover:underline"
        >
          ← Inventory
        </Link>
        <h1 className="mt-2 text-heading font-light tracking-[-0.8px]">
          Create listing
        </h1>
      </div>
      {user.verification_status !== "verified" ? (
        <p className="rounded-2xl bg-pale-stone px-4 py-3 text-body-sm">
          Account status: {user.verification_status}. You can prepare the form,
          but only verified farmers can publish listings.
        </p>
      ) : null}
      <ListingForm
        defaultLga={user.lga}
        farmerId={user.id}
        submitLabel="Publish listing"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
