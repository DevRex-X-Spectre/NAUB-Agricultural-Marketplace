/** Naira currency formatter for marketplace display */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Human-readable relative freshness from expiry date */
export function daysUntil(isoDate: string, from = new Date()): number {
  const target = new Date(isoDate + "T00:00:00");
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const diff = target.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Format phone for display: 0803… style if 11 digits */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}
