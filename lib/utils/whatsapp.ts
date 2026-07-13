/**
 * FR-05 deep links — WhatsApp and tel: for buyer→farmer contact.
 * Pure client-side; no backend involvement in Part B either.
 */

/** Normalize NG phone to international digits without + (e.g. 234803…) */
export function toWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  } else if (digits.startsWith("234")) {
    // already international
  } else if (digits.length === 10) {
    digits = "234" + digits;
  }
  return digits;
}

export function buildWhatsAppLink(
  phone: string,
  message: string
): string {
  const num = toWhatsAppNumber(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${num}?text=${text}`;
}

export function buildTelLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits}`;
}

export function defaultContactMessage(
  productName: string,
  buyerName: string
): string {
  return `Hello, I am ${buyerName}. I saw your listing for "${productName}" on the NAUB Agricultural Marketplace and would like to discuss.`;
}
