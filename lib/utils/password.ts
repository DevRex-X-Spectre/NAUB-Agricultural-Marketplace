/**
 * Client-side password hashing stand-in for bcrypt.
 *
 * SWAP FOR SERVER-SIDE bcrypt (or Supabase Auth) ON BACKEND MIGRATION.
 * Web Crypto SubtleCrypto SHA-256 + random salt is used only so the
 * localStorage prototype never stores plaintext passwords (Phase 7 / NFR-03 spirit).
 * This is NOT production-grade password security.
 */

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const usedSalt = salt ?? randomSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${usedSalt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return { hash: toHex(digest), salt: usedSalt };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === expectedHash;
}
