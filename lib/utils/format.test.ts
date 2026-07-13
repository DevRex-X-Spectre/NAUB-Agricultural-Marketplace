import { describe, expect, it } from "vitest";
import { daysUntil, formatNaira } from "./format";

describe("format utils", () => {
  it("formats naira", () => {
    const s = formatNaira(28000);
    expect(s).toMatch(/28/);
    expect(s).toMatch(/₦|NGN|NG/i);
  });

  it("computes days until expiry", () => {
    const from = new Date("2026-07-13T12:00:00");
    expect(daysUntil("2026-07-13", from)).toBe(0);
    expect(daysUntil("2026-07-16", from)).toBe(3);
    expect(daysUntil("2026-07-10", from)).toBeLessThan(0);
  });
});
