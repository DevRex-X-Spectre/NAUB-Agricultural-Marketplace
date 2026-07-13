import { describe, expect, it } from "vitest";
import { ValidationService } from "./validation-service";

const v = new ValidationService();

describe("ValidationService", () => {
  it("accepts Nigerian mobile numbers", () => {
    expect(v.isPhone("08031112222")).toBe(true);
    expect(v.isPhone("2348031112222")).toBe(true);
    expect(v.isPhone("+2348031112222")).toBe(true);
    expect(v.isPhone("12345")).toBe(false);
  });

  it("validates email format", () => {
    expect(v.isEmail("a@b.com")).toBe(true);
    expect(v.isEmail("not-an-email")).toBe(false);
  });

  it("sanitizes HTML/script tags", () => {
    const dirty = '<script>alert("x")</script>Hello <b>world</b>';
    const clean = v.sanitizeText(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("<b>");
    expect(clean.toLowerCase()).toContain("hello");
  });

  it("rejects weak registration payloads", () => {
    const res = v.validateRegistration({
      full_name: "",
      phone: "123",
      password: "12",
      lga: "",
    });
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("accepts valid registration", () => {
    const res = v.validateRegistration({
      full_name: "Musa Ibrahim",
      phone: "08031112222",
      password: "password123",
      lga: "Biu",
    });
    expect(res.success).toBe(true);
  });

  it("validates product fields", () => {
    const bad = v.validateProduct({
      name: "",
      description: "",
      price: -1,
      unit: "",
      quantity: 0,
      expiry_date: "",
      category_id: 0,
    });
    expect(bad.success).toBe(false);

    const good = v.validateProduct({
      name: "Maize",
      description: "Bags",
      price: 1000,
      unit: "bag",
      quantity: 5,
      expiry_date: "2030-01-01",
      category_id: 1,
    });
    expect(good.success).toBe(true);
  });

  it("validates star ratings 1–5", () => {
    expect(v.isRating(3)).toBeNull();
    expect(v.isRating(0)).toBeTruthy();
    expect(v.isRating(6)).toBeTruthy();
  });
});
