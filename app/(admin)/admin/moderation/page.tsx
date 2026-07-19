"use client";

import { ListingStatusBadge } from "@/components/marketplace/status-badge";
import { useSystemAlert } from "@/components/providers/system-alert-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { productRepository } from "@/lib/repositories";
import { adminService } from "@/lib/services";
import type { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils/format";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminModerationPage() {
  const { confirm } = useSystemAlert();
  const [flagged, setFlagged] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const f = await adminService.listFlaggedProducts();
    setFlagged(f.data ?? []);
    const products = await productRepository.findAll();
    setAll(products.filter((p) => p.status === "active").slice(0, 20));
  }

  useEffect(() => {
    void load();
  }, []);

  async function restore(id: number) {
    const res = await adminService.restoreListing(id);
    setMsg(res.success ? `Restored listing #${id}` : res.error ?? "Failed");
    await load();
  }

  async function remove(id: number) {
    const confirmed = await confirm({
      title: "Permanently delete listing?",
      message: `Listing #${id} will be removed for everyone. This action cannot be undone.`,
      confirmLabel: "Delete permanently",
      variant: "danger",
    });
    if (!confirmed) return;
    const res = await adminService.removeListing(id);
    setMsg(res.success ? `Removed listing #${id}` : res.error ?? "Failed");
    await load();
  }

  async function flag(id: number) {
    const res = await adminService.flagListing(id);
    setMsg(res.success ? `Flagged listing #${id}` : res.error ?? "Failed");
    await load();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-heading font-light tracking-[-0.8px]">
          Content moderation
        </h1>
        <p className="text-body-sm text-forest-canopy/70">
          Flagged queue and quick actions on active listings
        </p>
      </div>

      {msg ? (
        <p role="status" className="rounded-2xl bg-lime-sprout/50 px-4 py-3 text-body-sm">
          {msg}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-subheading font-light">Flagged queue</h2>
        {flagged.length === 0 ? (
          <p className="text-body-sm text-forest-canopy/70">
            No flagged listings.
          </p>
        ) : (
          flagged.map((p) => (
            <Card key={p.id} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-body-sm text-forest-canopy/70">
                    {formatNaira(p.price)} / {p.unit} · {p.lga}
                  </p>
                </div>
                <ListingStatusBadge status={p.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="!py-2"
                  onClick={() => void restore(p.id)}
                >
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  className="!py-2"
                  onClick={() => void remove(p.id)}
                >
                  Delete
                </Button>
                <Link href={`/products/${p.id}`}>
                  <Button variant="ghost" className="!py-2">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-subheading font-light">Active listings</h2>
        {all.map((p) => (
          <Card key={p.id} surface="pale" className="!p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-body-sm text-forest-canopy/70">
                  #{p.id} · {p.lga}
                </p>
              </div>
              <Button
                variant="secondary"
                className="!py-2"
                onClick={() => void flag(p.id)}
              >
                Flag
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
