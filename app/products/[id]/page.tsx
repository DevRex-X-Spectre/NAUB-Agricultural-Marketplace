"use client";

import { AppShell } from "@/components/layout/app-shell";
import { CategoryIcon } from "@/components/icons/category-icon";
import {
  FreshnessBadge,
  StarRating,
  VerificationBadge,
} from "@/components/marketplace/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  categoryRepository,
  userRepository,
} from "@/lib/repositories";
import {
  contactService,
  productService,
  reviewService,
} from "@/lib/services";
import type { Category, Product, PublicUser, Review } from "@/lib/types";
import {
  addToCart,
  isInCart,
  removeFromCart,
} from "@/lib/utils/cart";
import { daysUntil, formatNaira } from "@/lib/utils/format";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<PublicUser | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inCart, setInCart] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await productService.getById(id);
      if (!res.success || !res.data) {
        setError(res.error ?? "Not found");
        return;
      }
      setProduct(res.data);
      const f = await userRepository.findById(res.data.farmer_id);
      if (f) {
        const { password_hash: _h, password_salt: _s, ...pub } = f;
        setFarmer(pub);
      }
      const c = await categoryRepository.findById(res.data.category_id);
      setCategory(c);
      const rev = await reviewService.listForProduct(id);
      setReviews(rev.data ?? []);
    })();
  }, [id]);

  useEffect(() => {
    if (user?.role === "buyer") {
      setInCart(isInCart(user.id, id));
    }
  }, [user, id]);

  async function contact(method: "whatsapp" | "call") {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    if (user.role !== "buyer") {
      setError("Only buyer accounts can contact sellers.");
      return;
    }
    if (!product) return;
    const res = await contactService.logAndGetLinks({
      buyer_id: user.id,
      farmer_id: product.farmer_id,
      product_id: product.id,
      method,
    });
    if (!res.success || !res.data) {
      setError(res.error ?? "Could not log contact");
      return;
    }
    const url =
      method === "whatsapp" ? res.data.whatsapp_url : res.data.tel_url;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toggleCart() {
    if (!user || user.role !== "buyer") {
      router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    if (inCart) {
      removeFromCart(user.id, id);
      setInCart(false);
    } else {
      addToCart(user.id, id);
      setInCart(true);
    }
  }

  async function submitReview() {
    if (!user || !product || !farmer) return;
    setReviewMsg(null);
    const res = await reviewService.submit({
      buyer_id: user.id,
      farmer_id: farmer.id,
      product_id: product.id,
      rating,
      comment,
    });
    if (!res.success) {
      setReviewMsg(res.error ?? "Could not submit review");
      return;
    }
    setReviewMsg("Thanks — your review was saved.");
    const rev = await reviewService.listForProduct(id);
    setReviews(rev.data ?? []);
    const f = await userRepository.findById(farmer.id);
    if (f) {
      const { password_hash: _h, password_salt: _s, ...pub } = f;
      setFarmer(pub);
    }
  }

  if (error && !product) {
    return (
      <AppShell>
        <p>{error}</p>
        <Link href="/browse" className="mt-4 inline-block underline">
          Back to catalogue
        </Link>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <p className="text-forest-canopy/70">Loading…</p>
      </AppShell>
    );
  }

  const days = daysUntil(product.expiry_date);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-pale-stone">
          {product.image_path ? (
            <Image
              src={product.image_path}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              unoptimized={product.image_path.startsWith("data:")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-forest-canopy/40">
              No photo
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {category ? (
              <span className="inline-flex items-center gap-1.5 text-body-sm">
                <CategoryIcon
                  slug={category.slug}
                  iconKey={category.icon}
                  className="h-4 w-4"
                />
                {category.name}
              </span>
            ) : null}
            <FreshnessBadge days={days} />
          </div>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            {product.name}
          </h1>
          <p className="text-heading-sm font-medium">
            {formatNaira(product.price)}
            <span className="text-body font-normal text-forest-canopy/70">
              {" "}
              / {product.unit}
            </span>
          </p>
          <p className="text-body text-forest-canopy/85">
            {product.description}
          </p>
          <ul className="text-body-sm text-forest-canopy/80 space-y-1">
            <li>Quantity available: {product.quantity}</li>
            <li>LGA: {product.lga}</li>
            <li>Expires: {product.expiry_date}</li>
          </ul>

          {farmer ? (
            <Card surface="pale" className="!p-4">
              <p className="text-body-sm text-forest-canopy/70">Seller</p>
              <p className="font-medium">{farmer.full_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <VerificationBadge status={farmer.verification_status} />
                {farmer.review_count > 0 ? (
                  <StarRating
                    value={farmer.average_rating}
                    count={farmer.review_count}
                  />
                ) : (
                  <span className="text-body-sm text-forest-canopy/60">
                    No ratings yet
                  </span>
                )}
              </div>
            </Card>
          ) : null}

          {error ? (
            <p role="alert" className="text-body-sm">
              {error}
            </p>
          ) : null}

          {product.status === "active" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button className="w-full sm:w-auto" onClick={() => void contact("whatsapp")}>
                WhatsApp seller
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => void contact("call")}
              >
                Call seller
              </Button>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={toggleCart}
              >
                {inCart ? "Remove from shortlist" : "Add to shortlist"}
              </Button>
            </div>
          ) : (
            <p className="text-body-sm">This listing is not active for contact.</p>
          )}

          <p className="text-body-sm text-forest-canopy/60">
            Contact always logs a request first (FR-05), then opens WhatsApp or
            the dialer.
          </p>
        </div>
      </div>

      <section className="mt-10 flex flex-col gap-4">
        <h2 className="text-heading-sm font-light tracking-[-0.48px]">
          Reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="text-body-sm text-forest-canopy/70">No reviews yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <Card className="!p-4">
                  <StarRating value={r.rating} />
                  {r.comment ? (
                    <p className="mt-2 text-body-sm">{r.comment}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}

        {user?.role === "buyer" ? (
          <Card surface="pale" className="!p-5">
            <h3 className="text-subheading font-light">Leave a review</h3>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Only after you mark a contact as completed.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <label className="text-body-sm font-medium">
                Rating
                <select
                  className="mt-1 block min-h-11 w-full rounded-lg border border-forest-canopy/30 bg-warm-parchment px-3"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <Textarea
                label="Comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button onClick={() => void submitReview()} className="w-full sm:w-auto">
                Submit review
              </Button>
              {reviewMsg ? (
                <p className="text-body-sm" role="status">
                  {reviewMsg}
                </p>
              ) : null}
            </div>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}
