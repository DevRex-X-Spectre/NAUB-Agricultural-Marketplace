/**
 * FR-05 deep links: WhatsApp and tel: for marketplace contact.
 * The phone stored on a user profile IS their WhatsApp number.
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

export function buildWhatsAppLink(phone: string, message: string): string {
  const num = toWhatsAppNumber(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${num}?text=${text}`;
}

export function buildTelLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits}`;
}

/** Buyer messages the farmer (uses farmer WhatsApp = registered phone) */
export function buyerToFarmerMessage(
  productName: string,
  buyerName: string,
  buyerWhatsAppPhone: string
): string {
  return (
    `Hello, I am ${buyerName}. I saw your listing for "${productName}" ` +
    `on NAUB Agric Connect and would like to discuss. ` +
    `My WhatsApp number is ${buyerWhatsAppPhone}.`
  );
}

/** Farmer replies to the buyer (uses buyer WhatsApp = registered phone) */
export function farmerToBuyerMessage(
  productName: string,
  farmerName: string,
  farmerWhatsAppPhone: string
): string {
  return (
    `Hello, this is ${farmerName} from NAUB Agric Connect ` +
    `regarding your interest in "${productName}". ` +
    `You can reach me on WhatsApp at ${farmerWhatsAppPhone}.`
  );
}

/** @deprecated use buyerToFarmerMessage */
export function defaultContactMessage(
  productName: string,
  buyerName: string,
  buyerPhone?: string
): string {
  return buyerToFarmerMessage(
    productName,
    buyerName,
    buyerPhone ?? ""
  ).replace(" My WhatsApp number is .", "");
}
