"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { transportProviderRepository } from "@/lib/repositories";
import type { TransportProvider } from "@/lib/types";
import { buildTelLink } from "@/lib/utils/whatsapp";
import { useEffect, useState } from "react";

export default function TransportPage() {
  const [rows, setRows] = useState<TransportProvider[]>([]);

  useEffect(() => {
    transportProviderRepository.findAll().then(setRows);
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            Logistics directory
          </h1>
          <p className="mt-2 max-w-xl text-body-sm text-forest-canopy/80">
            Curated transport providers covering Biu and nearby LGAs. Contact
            them directly to move produce after you agree a sale.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {rows.map((t) => (
            <li key={t.id}>
              <Card className="!p-5">
                <h2 className="text-subheading font-light">{t.name}</h2>
                <p className="mt-1 text-body-sm text-forest-canopy/70">
                  Coverage: {t.coverage_lga ?? "—"}
                </p>
                {t.notes ? (
                  <p className="mt-2 text-body-sm">{t.notes}</p>
                ) : null}
                <a
                  href={buildTelLink(t.phone)}
                  className="mt-3 inline-flex min-h-11 items-center text-body-sm font-medium underline-offset-4 hover:underline"
                >
                  Call {t.phone}
                </a>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
