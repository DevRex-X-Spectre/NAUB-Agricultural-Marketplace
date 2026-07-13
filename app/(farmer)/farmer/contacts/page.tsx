"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { productRepository, userRepository } from "@/lib/repositories";
import { contactService } from "@/lib/services";
import type { ContactRequest, Product, PublicUser } from "@/lib/types";
import { useEffect, useState } from "react";

type Row = ContactRequest & {
  product?: Product;
  buyer?: PublicUser | null;
};

export default function FarmerContactsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    if (!user) return;
    const res = await contactService.listForFarmer(user.id);
    const list = res.data ?? [];
    const enriched: Row[] = [];
    for (const r of list) {
      const product = await productRepository.findById(r.product_id);
      const buyer = await userRepository.findById(r.buyer_id);
      enriched.push({
        ...r,
        product: product ?? undefined,
        buyer: buyer
          ? {
              id: buyer.id,
              full_name: buyer.full_name,
              phone: buyer.phone,
              email: buyer.email,
              lga: buyer.lga,
              role: buyer.role,
              verification_status: buyer.verification_status,
              average_rating: buyer.average_rating,
              review_count: buyer.review_count,
              created_at: buyer.created_at,
              last_login: buyer.last_login,
            }
          : null,
      });
    }
    setRows(enriched);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function markDone(id: number) {
    if (!user) return;
    await contactService.markCompleted(id, user.id);
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading font-light tracking-[-0.8px]">
          Contact requests
        </h1>
        <p className="text-body-sm text-forest-canopy/70">
          Buyers who reached out about your produce
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-body text-forest-canopy/70">No contact requests yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="!p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-body">
                      {r.buyer?.full_name ?? "Buyer"}
                    </p>
                    <p className="text-body-sm text-forest-canopy/70">
                      {r.product?.name ?? `Product #${r.product_id}`}
                    </p>
                    <p className="mt-1 text-body-sm">
                      via {r.method} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={r.status === "completed" ? "stone" : "lime"}>
                    {r.status}
                  </Badge>
                </div>
                {r.status === "sent" ? (
                  <Button
                    variant="secondary"
                    className="mt-3 w-full sm:w-auto"
                    onClick={() => void markDone(r.id)}
                  >
                    Mark completed
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
