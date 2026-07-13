import {
  contactRequestRepository,
  productRepository,
  reviewRepository,
  userRepository,
} from "@/lib/repositories";
import type {
  AdminDashboardStats,
  ListingStatus,
  Product,
  PublicUser,
  ServiceResult,
  User,
  UserId,
  VerificationStatus,
} from "@/lib/types";

function toPublic(user: User): PublicUser {
  const { password_hash: _h, password_salt: _s, ...rest } = user;
  return rest;
}

export class AdminService {
  /** FR-07: aggregate dashboard stats */
  async getDashboardStats(): Promise<ServiceResult<AdminDashboardStats>> {
    const [users, products, contacts, reviews] = await Promise.all([
      userRepository.findAll(),
      productRepository.findAll(),
      contactRequestRepository.findAll(),
      reviewRepository.findAll(),
    ]);

    const stats: AdminDashboardStats = {
      total_users: users.length,
      farmers: users.filter((u) => u.role === "farmer").length,
      buyers: users.filter((u) => u.role === "buyer").length,
      pending_verifications: users.filter(
        (u) => u.verification_status === "pending"
      ).length,
      active_listings: products.filter((p) => p.status === "active").length,
      flagged_listings: products.filter((p) => p.status === "flagged").length,
      contact_requests: contacts.length,
      reviews: reviews.length,
    };

    return { success: true, data: stats };
  }

  /** FR-08: verify / suspend / ban */
  async setVerificationStatus(
    userId: UserId,
    status: VerificationStatus
  ): Promise<ServiceResult<PublicUser>> {
    const user = await userRepository.findById(userId);
    if (!user) return { success: false, error: "User not found" };
    if (user.role === "admin") {
      return { success: false, error: "Cannot change admin verification status" };
    }
    const updated = await userRepository.update(userId, {
      verification_status: status,
    });
    if (!updated) return { success: false, error: "Update failed" };
    return { success: true, data: toPublic(updated) };
  }

  async listUsers(): Promise<ServiceResult<PublicUser[]>> {
    const users = await userRepository.findAll();
    return {
      success: true,
      data: users.map(toPublic).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    };
  }

  async listFlaggedProducts(): Promise<ServiceResult<Product[]>> {
    const flagged = await productRepository.findByStatus("flagged");
    return { success: true, data: flagged };
  }

  async setListingStatus(
    productId: number,
    status: ListingStatus
  ): Promise<ServiceResult<Product>> {
    const product = await productRepository.findById(productId);
    if (!product) return { success: false, error: "Listing not found" };
    const updated = await productRepository.update(productId, {
      status,
      updated_at: new Date().toISOString(),
    });
    if (!updated) return { success: false, error: "Update failed" };
    return { success: true, data: updated };
  }

  async flagListing(productId: number): Promise<ServiceResult<Product>> {
    return this.setListingStatus(productId, "flagged");
  }

  async restoreListing(productId: number): Promise<ServiceResult<Product>> {
    return this.setListingStatus(productId, "active");
  }

  async removeListing(productId: number): Promise<ServiceResult<true>> {
    const ok = await productRepository.delete(productId);
    if (!ok) return { success: false, error: "Listing not found" };
    return { success: true, data: true };
  }
}

export const adminService = new AdminService();
