"use client";

import { NotificationsPanel } from "@/components/marketplace/notifications-panel";
import { VerificationBadge } from "@/components/marketplace/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contactService, productService } from "@/lib/services";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    active: 0,
    sold: 0,
    expired: 0,
    flagged: 0,
    total: 0,
  });
  const [contacts, setContacts] = useState(0);
  const [archived, setArchived] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const arch = await productService.archiveExpiredListings();
      setArchived(arch.data ?? 0);
      const s = await productService.farmerStats(user.id);
      if (s.data) setStats(s.data);
      const c = await contactService.listForFarmer(user.id);
      setContacts(c.data?.filter((x) => x.status === "sent").length ?? 0);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-body-sm text-forest-canopy/70">Farmer dashboard</p>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            {user.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VerificationBadge status={user.verification_status} />
            <span className="text-body-sm text-forest-canopy/70">
              {user.lga}
            </span>
          </div>
        </div>
        <Link href="/farmer/listings/new">
          <Button
            className="w-full sm:w-auto"
            disabled={user.verification_status !== "verified"}
          >
            New listing
          </Button>
        </Link>
      </header>

      {archived > 0 ? (
        <p
          role="status"
          className="rounded-2xl bg-pale-stone px-4 py-3 text-body-sm"
        >
          {archived} listing{archived > 1 ? "s" : ""} auto-archived as expired
          (FR-09).
        </p>
      ) : null}

      <NotificationsPanel />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active", value: stats.active },
          { label: "Contacts", value: contacts },
          { label: "Sold", value: stats.sold },
          { label: "Expired", value: stats.expired },
        ].map((s) => (
          <Card key={s.label} surface="pale" className="!p-4">
            <p className="text-body-sm text-forest-canopy/70">{s.label}</p>
            <p className="mt-1 text-heading-sm font-light tracking-[-0.48px]">
              {s.value}
            </p>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row">
        <Link href="/farmer/listings" className="flex-1">
          <Card className="h-full !p-5 hover:bg-pale-stone/50">
            <h2 className="text-subheading font-light">My listings</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              {stats.total} total · filter by status
            </p>
          </Card>
        </Link>
        <Link href="/farmer/contacts" className="flex-1">
          <Card className="h-full !p-5 hover:bg-pale-stone/50">
            <h2 className="text-subheading font-light">Contact requests</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Buyers who messaged you
            </p>
          </Card>
        </Link>
      </section>
    </div>
  );
}
