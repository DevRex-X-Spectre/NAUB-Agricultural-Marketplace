/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing (client stand-in)", () => {
  it("hashes and verifies consistently", async () => {
    const { hash, salt } = await hashPassword("password123");
    expect(hash).toHaveLength(64);
    expect(salt.length).toBeGreaterThan(8);
    expect(await verifyPassword("password123", salt, hash)).toBe(true);
    expect(await verifyPassword("wrong", salt, hash)).toBe(false);
  });

  it("never stores plaintext in the hash", async () => {
    const { hash } = await hashPassword("password123");
    expect(hash).not.toContain("password");
  });
});
