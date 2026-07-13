import { describe, expect, it } from "vitest";
import {
  buildTelLink,
  buildWhatsAppLink,
  toWhatsAppNumber,
} from "./whatsapp";

describe("whatsapp utils", () => {
  it("normalizes NG numbers to international", () => {
    expect(toWhatsAppNumber("08031112222")).toBe("2348031112222");
    expect(toWhatsAppNumber("+2348031112222")).toBe("2348031112222");
  });

  it("builds wa.me deep links", () => {
    const url = buildWhatsAppLink("08031112222", "Hello maize");
    expect(url).toContain("https://wa.me/2348031112222");
    expect(url).toContain("text=");
  });

  it("builds tel links", () => {
    expect(buildTelLink("0803 111 2222")).toBe("tel:08031112222");
  });
});
