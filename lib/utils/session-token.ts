/** Simple opaque session token for localStorage auth prototype */

export function createSessionToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Session lifetime: 7 days */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
