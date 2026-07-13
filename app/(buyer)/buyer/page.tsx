"use client";

import { NotificationsPanel } from "@/components/marketplace/notifications-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { getCart } from "@/lib/utils/cart";
import { contactService } from "@/lib/services";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BuyerHomePage() {
  const { user } = useAuth();
  const [shortlist, setShortlist] = useState(0);
  const [contacts, setContacts] = useState(0);

  useEffect(() => {
    if (!user) return;
    setShortlist(getCart(user.id).length);
    contactService.listForBuyer(user.id).then((r) => {
      setContacts(r.data?.length ?? 0);
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-body-sm text-forest-canopy/70">Buyer home</p>
        <h1 className="text-heading font-light tracking-[-0.8px]">
          {user.full_name}
        </h1>
        <p className="mt-1 text-body-sm text-forest-canopy/70">{user.lga}</p>
      </header>

      <NotificationsPanel />

      <section className="grid grid-cols-2 gap-3">
        <Card surface="pale" className="!p-4">
          <p className="text-body-sm text-forest-canopy/70">Shortlist</p>
          <p className="text-heading-sm font-light">{shortlist}</p>
        </Card>
        <Card surface="pale" className="!p-4">
          <p className="text-body-sm text-forest-canopy/70">Contacts</p>
          <p className="text-heading-sm font-light">{contacts}</p>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Link href="/browse">
          <Card className="!p-5">
            <h2 className="text-subheading font-light">Browse market</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Filter by category, price, LGA, freshness
            </p>
          </Card>
        </Link>
        <Link href="/cart">
          <Card className="!p-5">
            <h2 className="text-subheading font-light">Seller shortlist</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Not a checkout cart — a list of sellers to contact
            </p>
          </Card>
        </Link>
        <Link href="/buyer/contacts">
          <Card className="!p-5">
            <h2 className="text-subheading font-light">My contacts</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Mark completed to unlock reviews
            </p>
          </Card>
        </Link>
      </section>
    </div>
  );
}
