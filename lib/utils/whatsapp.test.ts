import { describe, expect, it } from "vitest";
import {
  buildTelLink,
  buildWhatsAppLink,
  buyerToFarmerMessage,
  farmerToBuyerMessage,
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

  it("includes buyer WhatsApp number in message to farmer", () => {
    const msg = buyerToFarmerMessage("Maize", "Fatima", "0803 777 8888");
    expect(msg).toContain("Fatima");
    expect(msg).toContain("Maize");
    expect(msg).toContain("0803 777 8888");
    expect(msg).toContain("NAUB Agric Connect");
  });

  it("includes farmer WhatsApp when replying to buyer", () => {
    const msg = farmerToBuyerMessage("Goats", "Musa", "0803 111 2222");
    expect(msg).toContain("Musa");
    expect(msg).toContain("0803 111 2222");
  });
});
