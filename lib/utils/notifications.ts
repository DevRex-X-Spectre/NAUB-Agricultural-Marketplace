/**
 * In-app notifications computed from repository state on load (Phase 6).
 * No push backend — pure client-side derivation.
 */

import {
  contactRequestRepository,
  productRepository,
} from "@/lib/repositories";
import type { PublicUser } from "@/lib/types";
import { daysUntil } from "./format";

export type AppNotification = {
  id: string;
  kind: "contact_request" | "listing_expiring" | "pending_verification" | "flagged";
  title: string;
  body: string;
  href?: string;
};

export async function computeNotifications(
  user: PublicUser
): Promise<AppNotification[]> {
  const notes: AppNotification[] = [];

  if (user.role === "farmer") {
    const contacts = await contactRequestRepository.findByFarmerId(user.id);
    const unread = contacts.filter((c) => c.status === "sent");
    if (unread.length > 0) {
      notes.push({
        id: `contacts-${unread.length}`,
        kind: "contact_request",
        title: `${unread.length} new contact request${unread.length > 1 ? "s" : ""}`,
        body: "Buyers want to reach you about your listings.",
        href: "/farmer/contacts",
      });
    }

    const products = await productRepository.findByFarmerId(user.id);
    for (const p of products) {
      if (p.status !== "active") continue;
      const d = daysUntil(p.expiry_date);
      if (d >= 0 && d <= 3) {
        notes.push({
          id: `exp-${p.id}`,
          kind: "listing_expiring",
          title: `"${p.name}" expires in ${d} day${d === 1 ? "" : "s"}`,
          body: "Update stock or mark as sold before it auto-archives.",
          href: `/farmer/listings/${p.id}/edit`,
        });
      }
    }

    if (user.verification_status === "pending") {
      notes.push({
        id: "pending-verify",
        kind: "pending_verification",
        title: "Account pending verification",
        body: "An admin must verify you before you can create listings.",
        href: "/farmer",
      });
    }
  }

  if (user.role === "admin") {
    const products = await productRepository.findByStatus("flagged");
    if (products.length > 0) {
      notes.push({
        id: `flagged-${products.length}`,
        kind: "flagged",
        title: `${products.length} flagged listing${products.length > 1 ? "s" : ""}`,
        body: "Review the moderation queue.",
        href: "/admin/moderation",
      });
    }
  }

  return notes;
}
