"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/marketplace/product-card";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { productRepository } from "@/lib/repositories";
import type { Product } from "@/lib/types";
import { clearCart, getCart, removeFromCart } from "@/lib/utils/cart";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  async function load() {
    if (!user || user.role !== "buyer") {
      setProducts([]);
      return;
    }
    const items = getCart(user.id);
    const list: Product[] = [];
    for (const item of items) {
      const p = await productRepository.findById(item.product_id);
      if (p) list.push(p);
    }
    setProducts(list);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            Seller shortlist
          </h1>
          <p className="mt-2 max-w-xl text-body-sm text-forest-canopy/80">
            This is <strong className="font-medium">not a checkout cart</strong>
            . There is no payment on this platform. Use it as a list of sellers
            you plan to contact via WhatsApp or phone.
          </p>
        </header>

        {loading ? (
          <p className="text-forest-canopy/70">Loading…</p>
        ) : !user ? (
          <p className="text-body">
            <Link href="/login?next=/cart" className="underline">
              Sign in as a buyer
            </Link>{" "}
            to save a shortlist.
          </p>
        ) : user.role !== "buyer" ? (
          <p className="text-body">
            Shortlist is for buyer accounts. You are signed in as {user.role}.
          </p>
        ) : products.length === 0 ? (
          <p className="text-body text-forest-canopy/70">
            Shortlist is empty.{" "}
            <Link href="/browse" className="underline">
              Browse listings
            </Link>
          </p>
        ) : (
          <>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  if (user) {
                    clearCart(user.id);
                    setProducts([]);
                  }
                }}
              >
                Clear shortlist
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="flex flex-col gap-2">
                  <ProductCard product={p} />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (user) {
                        removeFromCart(user.id, p.id);
                        setProducts((prev) => prev.filter((x) => x.id !== p.id));
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
