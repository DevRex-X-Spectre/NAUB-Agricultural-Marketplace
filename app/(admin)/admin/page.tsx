"use client";

import { NotificationsPanel } from "@/components/marketplace/notifications-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { adminService } from "@/lib/services";
import type { AdminDashboardStats } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    adminService.getDashboardStats().then((r) => {
      if (r.data) setStats(r.data);
    });
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-body-sm text-forest-canopy/70">Admin</p>
        <h1 className="text-heading font-light tracking-[-0.8px]">
          Marketplace overview
        </h1>
      </header>

      <NotificationsPanel />

      {stats ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Users", value: stats.total_users },
            { label: "Farmers", value: stats.farmers },
            { label: "Buyers", value: stats.buyers },
            { label: "Pending verify", value: stats.pending_verifications },
            { label: "Active listings", value: stats.active_listings },
            { label: "Flagged", value: stats.flagged_listings },
            { label: "Contacts", value: stats.contact_requests },
            { label: "Reviews", value: stats.reviews },
          ].map((s) => (
            <Card key={s.label} surface="pale" className="!p-4">
              <p className="text-body-sm text-forest-canopy/70">{s.label}</p>
              <p className="mt-1 text-heading-sm font-light">{s.value}</p>
            </Card>
          ))}
        </section>
      ) : (
        <p className="text-forest-canopy/70">Loading stats…</p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/users">
          <Card className="h-full !p-5">
            <h2 className="text-subheading font-light">Users</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Verify, suspend, or ban
            </p>
          </Card>
        </Link>
        <Link href="/admin/moderation">
          <Card className="h-full !p-5">
            <h2 className="text-subheading font-light">Moderation</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Flagged listings queue
            </p>
          </Card>
        </Link>
        <Link href="/admin/prices">
          <Card className="h-full !p-5">
            <h2 className="text-subheading font-light">Price trends</h2>
            <p className="mt-1 text-body-sm text-forest-canopy/70">
              Top traded categories (FR-10)
            </p>
          </Card>
        </Link>
      </section>
    </div>
  );
}
