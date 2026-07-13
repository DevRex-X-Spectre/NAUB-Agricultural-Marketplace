"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { productRepository, userRepository } from "@/lib/repositories";
import { contactService } from "@/lib/services";
import type { ContactRequest, Product, PublicUser } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/utils/format";
import { MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";

type Row = ContactRequest & {
  product?: Product;
  buyer?: PublicUser | null;
};

export default function FarmerContactsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  async function openToBuyer(requestId: number, method: "whatsapp" | "call") {
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
        <h1 className="text-heading font-light tracking-tight">
          Contact requests
        </h1>
        <p className="text-body-sm text-forest-canopy/70">
          Buyers who reached out. Their WhatsApp number is the phone they
          registered with. You can message them back the same way.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-3 text-body-sm text-red-700">
          {error}
        </p>
      ) : null}

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
                    {r.buyer?.phone ? (
                      <p className="mt-1 text-body-sm text-forest-canopy">
                        WhatsApp:{" "}
                        <span className="font-medium">
                          {formatPhoneDisplay(r.buyer.phone)}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-body-sm text-forest-canopy/60">
                      via {r.method} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={r.status === "completed" ? "stone" : "lime"}>
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => void openToBuyer(r.id, "whatsapp")}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    WhatsApp buyer
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => void openToBuyer(r.id, "call")}
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Call buyer
                  </Button>
                  {r.status === "sent" ? (
                    <Button
                      variant="ghost"
                      className="w-full sm:w-auto"
                      onClick={() => void markDone(r.id)}
                    >
                      Mark completed
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
