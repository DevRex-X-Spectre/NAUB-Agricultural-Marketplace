"use client";

import { VerificationBadge } from "@/components/marketplace/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminService } from "@/lib/services";
import type { PublicUser, UserId, VerificationStatus } from "@/lib/types";
import { useEffect, useState } from "react";

const ACTIONS: { status: VerificationStatus; label: string }[] = [
  { status: "verified", label: "Verify" },
  { status: "pending", label: "Pending" },
  { status: "suspended", label: "Suspend" },
  { status: "banned", label: "Ban" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await adminService.listUsers();
    setUsers(res.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: UserId, status: VerificationStatus) {
    setMsg(null);
    const res = await adminService.setVerificationStatus(id, status);
    if (!res.success) {
      setMsg(res.error ?? "Failed");
      return;
    }
    setMsg(`Updated user #${id} to ${status}`);
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading font-light tracking-[-0.8px]">
          User management
        </h1>
        <p className="text-body-sm text-forest-canopy/70">
          FR-08: verification status controls marketplace access
        </p>
      </div>

      {msg ? (
        <p role="status" className="rounded-2xl bg-lime-sprout/50 px-4 py-3 text-body-sm">
          {msg}
        </p>
      ) : null}

      {/* Mobile card list, not a squeezed table */}
      <ul className="flex flex-col gap-3">
        {users.map((u) => (
          <li key={u.id}>
            <Card className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-body-sm text-forest-canopy/70">
                    {u.role} · {u.phone} · {u.lga}
                  </p>
                </div>
                <VerificationBadge status={u.verification_status} />
              </div>
              {u.role !== "admin" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIONS.filter((a) => a.status !== u.verification_status).map(
                    (a) => (
                      <Button
                        key={a.status}
                        variant="secondary"
                        className="!py-2 !px-3 text-body-sm"
                        onClick={() => void setStatus(u.id, a.status)}
                      >
                        {a.label}
                      </Button>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-2 text-body-sm text-forest-canopy/60">
                  Admin accounts cannot be re-statused here.
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
