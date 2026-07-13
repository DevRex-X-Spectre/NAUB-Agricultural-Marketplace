"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  priceHistoryService,
  type CategoryTrend,
} from "@/lib/services/price-history-service";
import { formatNaira } from "@/lib/utils/format";
import { useEffect, useState } from "react";

export default function AdminPricesPage() {
  const [trends, setTrends] = useState<CategoryTrend[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await priceHistoryService.getTopCategoryTrends(10);
    setTrends(res.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function snapshot() {
    const res = await priceHistoryService.recordSnapshots();
    setMsg(
      res.success
        ? `Recorded ${res.data?.length ?? 0} category snapshots`
        : res.error ?? "Failed"
    );
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            Price trends
          </h1>
          <p className="text-body-sm text-forest-canopy/70">
            FR-10 — top traded categories by listing volume
          </p>
        </div>
        <Button variant="secondary" onClick={() => void snapshot()}>
          Record snapshot
        </Button>
      </header>

      {msg ? (
        <p role="status" className="text-body-sm">
          {msg}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {trends.map((t, i) => (
          <li key={t.category_id}>
            <Card className="!p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono text-[12px] text-forest-canopy/50">
                    #{String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="text-subheading font-light">
                    {t.category_name}
                  </p>
                  <p className="text-body-sm text-forest-canopy/70">
                    {t.sample_count} listing{t.sample_count === 1 ? "" : "s"} ·{" "}
                    {t.history.length} history points
                  </p>
                </div>
                <p className="text-heading-sm font-medium">
                  {formatNaira(t.avg_price)}
                </p>
              </div>
              {t.history.length > 0 ? (
                <p className="mt-3 font-mono text-[12px] leading-relaxed tracking-[0.015em] text-forest-canopy/65 break-words">
                  {t.history
                    .slice(-7)
                    .map(
                      (h) =>
                        `${h.recorded_on.slice(5)}:${Math.round(h.avg_price)}`
                    )
                    .join(" · ")}
                </p>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
