/**
 * Integration-style flows against pure service/validation logic that does not
 * require localStorage. Full browser flows are exercised via /dev/data-test.
 *
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { validationService } from "@/lib/services/validation-service";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import {
  buildWhatsAppLink,
  defaultContactMessage,
} from "@/lib/utils/whatsapp";

describe("critical flow contracts", () => {
  it("register → list → contact message shape", async () => {
    const reg = validationService.validateRegistration({
      full_name: "Test Farmer",
      phone: "08035550000",
      email: "farmer@example.com",
      password: "secret12",
      lga: "Biu",
    });
    expect(reg.success).toBe(true);

    const listing = validationService.validateProduct({
      name: "White Maize",
      description: "50kg bags",
      price: 28000,
      unit: "bag",
      quantity: 10,
      expiry_date: "2026-12-01",
      category_id: 1,
    });
    expect(listing.success).toBe(true);

    const msg = defaultContactMessage("White Maize", "Fatima Sani");
    const url = buildWhatsAppLink("08031112222", msg);
    expect(url).toContain("wa.me/234");
    expect(decodeURIComponent(url)).toContain("White Maize");
  });

  it("password never remains plaintext after hash", async () => {
    const plain = "password123";
    const { hash, salt } = await hashPassword(plain);
    expect(hash).not.toEqual(plain);
    expect(await verifyPassword(plain, salt, hash)).toBe(true);
  });

  it("review rating bounds for FR-06", () => {
    expect(validationService.isRating(1)).toBeNull();
    expect(validationService.isRating(5)).toBeNull();
    expect(validationService.isRating(0)).toBeTruthy();
  });

  it("sanitizes XSS-like input before storage/render", () => {
    const out = validationService.sanitizeText(
      '<img src=x onerror=alert(1)>Maize'
    );
    expect(out.toLowerCase()).not.toContain("onerror");
    expect(out).toContain("Maize");
  });
});
