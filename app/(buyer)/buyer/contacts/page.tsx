"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { productRepository, userRepository } from "@/lib/repositories";
import { contactService } from "@/lib/services";
import type { ContactRequest, Product } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/utils/format";
import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = ContactRequest & {
  product?: Product;
  farmerName?: string;
  farmerPhone?: string;
};

export default function BuyerContactsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const res = await contactService.listForBuyer(user.id);
    const list = res.data ?? [];
    const enriched: Row[] = [];
    for (const r of list) {
      const product =
        (await productRepository.findById(r.product_id)) ?? undefined;
      const farmer = await userRepository.findById(r.farmer_id);
      enriched.push({
        ...r,
        product,
        farmerName: farmer?.full_name,
        farmerPhone: farmer?.phone,
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

  async function openToFarmer(requestId: number, method: "whatsapp" | "call") {
    if (!user) return;
    setError(null);
    const res = await contactService.openChannel(requestId, method, user.id);
    if (!res.success || !res.data) {
      setError(res.error ?? "Could not open contact");
      return;
    }
    window.open(res.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading font-light tracking-tight">My contacts</h1>
        <p className="text-body-sm text-forest-canopy/70">
          Sellers are reached on the WhatsApp number they registered with.
          After a deal, mark completed so you can leave a review.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-3 py-3 text-body-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-body text-forest-canopy/70">
          No contacts yet.{" "}
          <Link href="/browse" className="underline">
            Browse the market
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="!p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {r.product?.name ?? `Product #${r.product_id}`}
                    </p>
                    <p className="text-body-sm text-forest-canopy/70">
                      Seller: {r.farmerName ?? "Unknown"}
                    </p>
                    {r.farmerPhone ? (
                      <p className="mt-1 text-body-sm text-forest-canopy">
                        WhatsApp:{" "}
                        <span className="font-medium">
                          {formatPhoneDisplay(r.farmerPhone)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <Badge tone={r.status === "completed" ? "stone" : "lime"}>
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => void openToFarmer(r.id, "whatsapp")}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    WhatsApp seller
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => void openToFarmer(r.id, "call")}
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Call seller
                  </Button>
                  {r.status === "sent" ? (
                    <Button
                      variant="ghost"
                      className="w-full sm:w-auto"
                      onClick={() => void markDone(r.id)}
                    >
                      Mark completed
                    </Button>
                  ) : (
                    <Link href={`/products/${r.product_id}`}>
                      <Button variant="ghost" className="w-full sm:w-auto">
                        Leave review
                      </Button>
                    </Link>
                  )}
                  <Link href={`/products/${r.product_id}`}>
                    <Button variant="ghost" className="w-full sm:w-auto">
                      View listing
                    </Button>
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
