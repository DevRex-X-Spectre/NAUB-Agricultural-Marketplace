"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DATA_SOURCE } from "@/lib/config";
import { categoryRepository, productRepository } from "@/lib/repositories";
import { resetMarketplace, runSeed } from "@/lib/seed";
import { authService, productService, validationService } from "@/lib/services";
import Link from "next/link";
import { useCallback, useState } from "react";

type LogLine = { ok: boolean; label: string; detail: string };

export default function DataTestPage() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);

  const push = useCallback((line: LogLine) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const runSuite = async () => {
    setRunning(true);
    setLogs([]);
    try {
      const seed = await runSeed(false);
      push({
        ok: true,
        label: "Bootstrap",
        detail:
          seed.message +
          (seed.counts ? ` ${JSON.stringify(seed.counts)}` : ""),
      });

      const cats = await categoryRepository.findAll();
      push({
        ok: cats.length > 0,
        label: "Categories",
        detail: `${cats.length}: ${cats.map((c) => c.name).join(", ")}`,
      });

      const products = await productRepository.findAll();
      push({
        ok: products.length === 0,
        label: "Listings empty",
        detail: `${products.length} products (expected 0 until users list)`,
      });

      const session = await authService.getCurrentUser();
      push({
        ok: true,
        label: "Current session",
        detail: session.data
          ? `${session.data.full_name} (${session.data.role})`
          : "Not signed in — register at /register",
      });

      const phoneOk = validationService.isPhone("08031112222");
      push({
        ok: phoneOk,
        label: "ValidationService",
        detail: phoneOk ? "phone format ok" : "phone validation failed",
      });

      const archive = await productService.archiveExpiredListings();
      push({
        ok: archive.success,
        label: "archiveExpiredListings",
        detail: `archived ${archive.data ?? 0}`,
      });

      push({
        ok: true,
        label: "Suite complete",
        detail: `DATA_SOURCE=${DATA_SOURCE}`,
      });
    } catch (e) {
      push({
        ok: false,
        label: "Unhandled error",
        detail: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  };

  const wipe = async () => {
    setRunning(true);
    setLogs([]);
    try {
      await authService.logout();
      const result = await resetMarketplace();
      push({
        ok: result.seeded,
        label: "Reset marketplace",
        detail: result.message + (result.counts ? ` ${JSON.stringify(result.counts)}` : ""),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-full bg-warm-parchment text-forest-canopy">
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-body-sm text-forest-canopy/70 underline-offset-4 hover:underline"
          >
            ← Home
          </Link>
          <Badge tone="stone">Data layer · clean marketplace</Badge>
          <h1 className="text-heading font-light tracking-[-0.8px]">
            Bootstrap & health check
          </h1>
          <p className="text-body-sm text-forest-canopy/80">
            No demo users or listings. Register at{" "}
            <Link href="/register" className="underline">
              /register
            </Link>
            , then list as a farmer or browse as a buyer.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={runSuite} disabled={running} className="w-full sm:w-auto">
            {running ? "Running…" : "Run health check"}
          </Button>
          <Button
            variant="secondary"
            onClick={wipe}
            disabled={running}
            className="w-full sm:w-auto"
          >
            Wipe data & re-bootstrap
          </Button>
        </div>

        <Card surface="pale" className="p-4 sm:p-6">
          <h2 className="text-subheading font-light tracking-[-0.3px]">
            How to use
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-body-sm">
            <li>Open Register → choose Farmer or Buyer</li>
            <li>Sign in with your phone + password</li>
            <li>Farmers: create listings under Dashboard</li>
            <li>Buyers: browse market and contact sellers</li>
          </ol>
        </Card>

        <ul className="flex flex-col gap-3" aria-live="polite">
          {logs.length === 0 ? (
            <li className="text-body-sm text-forest-canopy/60">
              No runs yet.
            </li>
          ) : (
            logs.map((line, i) => (
              <li key={i}>
                <Card surface={line.ok ? "parchment" : "pale"} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={line.ok ? "lime" : "outline"}>
                      {line.ok ? "ok" : "fail"}
                    </Badge>
                    <span className="font-medium text-body-sm">{line.label}</span>
                  </div>
                  <p className="mt-2 break-words font-mono text-[12px] leading-relaxed tracking-[0.015em] text-forest-canopy/80">
                    {line.detail}
                  </p>
                </Card>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
