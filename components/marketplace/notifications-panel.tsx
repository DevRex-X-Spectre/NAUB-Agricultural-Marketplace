"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";
import {
  computeNotifications,
  type AppNotification,
} from "@/lib/utils/notifications";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationsPanel() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const n = await computeNotifications(user);
      if (!cancelled) setNotes(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || notes.length === 0) return null;

  return (
    <section aria-label="Notifications" className="flex flex-col gap-2">
      <h2 className="text-body-sm font-medium tracking-[-0.42px]">
        Notifications
      </h2>
      <ul className="flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id}>
            <Card surface="pale" className="!p-4">
              {n.href ? (
                <Link href={n.href} className="block">
                  <p className="text-body-sm font-medium">{n.title}</p>
                  <p className="mt-1 text-body-sm text-forest-canopy/70">
                    {n.body}
                  </p>
                </Link>
              ) : (
                <>
                  <p className="text-body-sm font-medium">{n.title}</p>
                  <p className="mt-1 text-body-sm text-forest-canopy/70">
                    {n.body}
                  </p>
                </>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
