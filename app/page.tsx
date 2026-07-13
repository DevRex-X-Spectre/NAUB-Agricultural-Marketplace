"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/marketplace/product-card";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { productService } from "@/lib/services";
import type { Product } from "@/lib/types";
import {
  ArrowRight,
  BadgeCheck,
  Leaf,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  Tractor,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const res = await productService.filterCatalogue({});
      if (res.success && res.data) {
        setPreview(res.data.slice(0, 4));
      }
    })();
  }, []);

  const dash =
    user?.role === "farmer"
      ? "/farmer"
      : user?.role === "admin"
        ? "/admin"
        : user?.role === "buyer"
          ? "/browse"
          : null;

  return (
    <AppShell>
      <div className="flex flex-col gap-14 sm:gap-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-forest-canopy/10 bg-pale-stone">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-sprout/40 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-forest-canopy/10 blur-2xl"
            aria-hidden
          />

          <div className="relative grid gap-8 p-6 sm:gap-10 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-12">
            <div className="flex flex-col gap-5">
              <h1 className="max-w-xl text-[2rem] font-light leading-[1.1] tracking-[-1.2px] text-forest-canopy sm:text-display sm:tracking-[-1.44px]">
                Farm to market,{" "}
                <span className="relative whitespace-nowrap">
                  without the maze
                  <span
                    className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-lime-sprout/80"
                    aria-hidden
                  />
                </span>
                .
              </h1>

              <p className="max-w-lg text-body leading-[1.5] text-forest-canopy/85 sm:text-body-lg">
                List produce, filter by LGA and freshness, and reach sellers on
                WhatsApp or phone. Built for smallholder farmers and buyers on a
                mobile connection.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                {dash ? (
                  <Link href={dash}>
                    <Button className="w-full gap-2 sm:w-auto">
                      Go to dashboard
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button className="w-full gap-2 sm:w-auto">
                        Create free account
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                    </Link>
                    <Link href="/browse">
                      <Button
                        variant="secondary"
                        className="w-full sm:w-auto"
                      >
                        Browse market
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-forest-canopy/70">
                <li className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  Phone-first signup
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                  Admin moderation
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Leaf className="h-4 w-4 shrink-0" aria-hidden />
                  Freshness filters
                </li>
              </ul>
            </div>

            {/* Visual panel */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card
                surface="parchment"
                className="col-span-2 flex flex-row items-center gap-4 !p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-sprout">
                  <Tractor
                    className="h-6 w-6 text-forest-canopy"
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="text-body font-medium tracking-[-0.4px]">
                    Direct farm listings
                  </p>
                  <p className="mt-0.5 text-body-sm text-forest-canopy/70">
                    Price, quantity, LGA, and photo in one form
                  </p>
                </div>
              </Card>
              <Card surface="parchment" className="flex flex-col gap-3 !p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-canopy text-warm-parchment">
                  <Users className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-body-sm font-medium">Buyers & farmers</p>
                <p className="text-body-sm text-forest-canopy/65">
                  Contact via WhatsApp or call — no checkout maze
                </p>
              </Card>
              <Card surface="parchment" className="flex flex-col gap-3 !p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-canopy text-warm-parchment">
                  <BadgeCheck className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-body-sm font-medium">Trusted trade</p>
                <p className="text-body-sm text-forest-canopy/65">
                  Ratings after completed contacts
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Sprout,
              code: "Farmers",
              title: "List in minutes",
              body: "Photo, price, quantity, and LGA — reach buyers without middlemen.",
            },
            {
              icon: MapPin,
              code: "Buyers",
              title: "Filter what matters",
              body: "Category, price, location, and days-to-expiry on every card.",
            },
            {
              icon: ShieldCheck,
              code: "Trust",
              title: "Ratings & oversight",
              body: "Seller stars after real contacts; admins moderate the market.",
            },
          ].map((item) => (
            <Card key={item.code} surface="pale" className="!p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-warm-parchment border border-forest-canopy/10">
                <item.icon
                  className="h-5 w-5 text-forest-canopy"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <p className="mt-4 font-mono text-[12px] tracking-[0.015em] text-forest-canopy/60">
                {item.code}
              </p>
              <h2 className="mt-1 text-heading-sm font-light tracking-[-0.48px]">
                {item.title}
              </h2>
              <p className="mt-2 text-body-sm text-forest-canopy/80">
                {item.body}
              </p>
            </Card>
          ))}
        </section>

        {preview.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-heading-sm font-light tracking-[-0.48px] sm:text-heading sm:tracking-[-0.8px]">
                Fresh on the market
              </h2>
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-body-sm underline-offset-4 hover:underline shrink-0"
              >
                See all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {preview.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[28px] bg-forest-canopy px-6 py-10 text-warm-parchment sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-lg">
              <h2 className="text-heading-sm font-light tracking-[-0.48px] sm:text-heading">
                Ready when you are
              </h2>
              <p className="mt-3 text-body text-warm-parchment/85">
                Registration takes under three minutes — phone number, LGA, and
                a password. No email required.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=farmer">
                <Button variant="inverse" className="w-full sm:w-auto">
                  I am a farmer
                </Button>
              </Link>
              <Link href="/register?role=buyer">
                <Button
                  variant="ghost"
                  className="w-full !text-warm-parchment sm:w-auto"
                >
                  I am a buyer
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
