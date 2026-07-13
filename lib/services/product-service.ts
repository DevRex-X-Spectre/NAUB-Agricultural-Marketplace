import {
  productRepository,
  userRepository,
} from "@/lib/repositories";
import type {
  CreateProductInput,
  ListingStatus,
  Product,
  ProductFilter,
  ServiceResult,
  UpdateProductInput,
  UserId,
} from "@/lib/types";
import { sameId } from "@/lib/types";
import { daysUntil, nowIso, todayIsoDate } from "@/lib/utils/format";
import { validationService } from "./validation-service";

export class ProductService {
  /**
   * FR-09: auto-archive listings past expiry_date.
   * Call on app/dashboard load — flips status to expired.
   */
  async archiveExpiredListings(): Promise<ServiceResult<number>> {
    const today = todayIsoDate();
    const expired = await productRepository.findExpiredActive(today);
    let count = 0;
    for (const p of expired) {
      await productRepository.update(p.id, {
        status: "expired",
        updated_at: nowIso(),
      });
      count += 1;
    }
    return { success: true, data: count };
  }

  async create(input: CreateProductInput): Promise<ServiceResult<Product>> {
    const farmer = await userRepository.findById(input.farmer_id);
    if (!farmer || farmer.role !== "farmer") {
      return { success: false, error: "Only farmers can create listings" };
    }
    if (farmer.verification_status === "suspended") {
      return { success: false, error: "Suspended accounts cannot create listings" };
    }
    if (farmer.verification_status === "banned") {
      return { success: false, error: "Banned accounts cannot create listings" };
    }
    if (farmer.verification_status === "pending") {
      return {
        success: false,
        error:
          "Your farmer account is pending verification. An admin must verify you before you can list products.",
      };
    }

    const v = validationService.validateProduct({
      name: input.name,
      description: input.description,
      price: input.price,
      unit: input.unit,
      quantity: input.quantity,
      expiry_date: input.expiry_date,
      category_id: input.category_id,
    });
    if (!v.success) return { success: false, error: v.error };

    const now = nowIso();
    const product = await productRepository.create({
      farmer_id: input.farmer_id,
      category_id: input.category_id,
      name: validationService.sanitizeText(input.name),
      description: validationService.sanitizeText(input.description),
      price: input.price,
      unit: validationService.sanitizeText(input.unit),
      quantity: input.quantity,
      expiry_date: input.expiry_date,
      status: "active",
      // local: base64/path · supabase: Storage public URL via prepareListingImage
      image_path: input.image_path ?? null,
      lga: validationService.sanitizeText(input.lga || farmer.lga),
      created_at: now,
      updated_at: now,
    });

    return { success: true, data: product };
  }

  async update(
    productId: number,
    farmerId: UserId,
    input: UpdateProductInput
  ): Promise<ServiceResult<Product>> {
    const existing = await productRepository.findById(productId);
    if (!existing) return { success: false, error: "Listing not found" };
    if (!sameId(existing.farmer_id, farmerId)) {
      return { success: false, error: "You can only edit your own listings" };
    }

    const patch: Partial<Product> = { updated_at: nowIso() };
    if (input.name != null) {
      patch.name = validationService.sanitizeText(input.name);
    }
    if (input.description != null) {
      patch.description = validationService.sanitizeText(input.description);
    }
    if (input.price != null) patch.price = input.price;
    if (input.unit != null) {
      patch.unit = validationService.sanitizeText(input.unit);
    }
    if (input.quantity != null) patch.quantity = input.quantity;
    if (input.expiry_date != null) patch.expiry_date = input.expiry_date;
    if (input.category_id != null) patch.category_id = input.category_id;
    if (input.image_path !== undefined) patch.image_path = input.image_path;
    if (input.lga != null) {
      patch.lga = validationService.sanitizeText(input.lga);
    }
    if (input.status != null) patch.status = input.status;

    const updated = await productRepository.update(productId, patch);
    if (!updated) return { success: false, error: "Failed to update listing" };
    return { success: true, data: updated };
  }

  async delete(
    productId: number,
    farmerId: UserId
  ): Promise<ServiceResult<true>> {
    const existing = await productRepository.findById(productId);
    if (!existing) return { success: false, error: "Listing not found" };
    if (!sameId(existing.farmer_id, farmerId)) {
      return { success: false, error: "You can only delete your own listings" };
    }
    await productRepository.delete(productId);
    return { success: true, data: true };
  }

  async getById(id: number): Promise<ServiceResult<Product>> {
    const product = await productRepository.findById(id);
    if (!product) return { success: false, error: "Listing not found" };
    return { success: true, data: product };
  }

  async listByFarmer(
    farmerId: UserId,
    status?: ListingStatus
  ): Promise<ServiceResult<Product[]>> {
    let products = await productRepository.findByFarmerId(farmerId);
    if (status) {
      products = products.filter((p) => p.status === status);
    }
    products.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return { success: true, data: products };
  }

  /**
   * FR-04: filter catalogue by category, price, LGA, freshness.
   * Always runs archive pass first so expired items don't appear as active.
   */
  async filterCatalogue(
    filter: ProductFilter = {}
  ): Promise<ServiceResult<Product[]>> {
    await this.archiveExpiredListings();

    let products = await productRepository.findAll();
    const status = filter.status ?? "active";
    products = products.filter((p) => p.status === status);

    if (filter.category_id != null) {
      products = products.filter((p) => p.category_id === filter.category_id);
    }
    if (filter.min_price != null) {
      products = products.filter((p) => p.price >= filter.min_price!);
    }
    if (filter.max_price != null) {
      products = products.filter((p) => p.price <= filter.max_price!);
    }
    if (filter.lga) {
      const lga = filter.lga.toLowerCase();
      products = products.filter((p) => p.lga.toLowerCase() === lga);
    }
    if (filter.max_days_to_expiry != null) {
      products = products.filter(
        (p) => daysUntil(p.expiry_date) <= filter.max_days_to_expiry!
      );
    }
    if (filter.farmer_id != null) {
      products = products.filter((p) =>
        sameId(p.farmer_id, filter.farmer_id!)
      );
    }
    if (filter.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    products.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, data: products };
  }

  async farmerStats(farmerId: UserId): Promise<
    ServiceResult<{
      active: number;
      sold: number;
      expired: number;
      flagged: number;
      total: number;
    }>
  > {
    const products = await productRepository.findByFarmerId(farmerId);
    const stats = {
      active: 0,
      sold: 0,
      expired: 0,
      flagged: 0,
      total: products.length,
    };
    for (const p of products) {
      if (p.status in stats) {
        stats[p.status as keyof typeof stats] += 1;
      }
    }
    return { success: true, data: stats };
  }
}

export const productService = new ProductService();
