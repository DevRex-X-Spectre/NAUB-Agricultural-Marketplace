/**
 * Lightweight virtual shortlist ("contact these sellers") — not a checkout cart.
 * Stored in localStorage keyed by buyer id (works for number or UUID).
 */

import { STORAGE_NAMESPACE } from "@/lib/config";
import type { UserId } from "@/lib/types";

export type CartItem = {
  product_id: number;
  added_at: string;
};

function cartKey(userId: UserId): string {
  return `${STORAGE_NAMESPACE}:cart:${String(userId)}`;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function getCart(userId: UserId): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(cartKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCart(userId: UserId, items: CartItem[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(cartKey(userId), JSON.stringify(items));
}

export function addToCart(userId: UserId, productId: number): CartItem[] {
  const items = getCart(userId);
  if (items.some((i) => i.product_id === productId)) return items;
  const next = [
    ...items,
    { product_id: productId, added_at: new Date().toISOString() },
  ];
  setCart(userId, next);
  return next;
}

export function removeFromCart(
  userId: UserId,
  productId: number
): CartItem[] {
  const next = getCart(userId).filter((i) => i.product_id !== productId);
  setCart(userId, next);
  return next;
}

export function clearCart(userId: UserId): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(cartKey(userId));
}

export function isInCart(userId: UserId, productId: number): boolean {
  return getCart(userId).some((i) => i.product_id === productId);
}
