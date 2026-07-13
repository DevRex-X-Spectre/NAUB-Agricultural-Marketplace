import type { ListingStatus, Product, UserId } from "@/lib/types";
import { sameId } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "products" as const;

export class ProductRepository implements Repository<Product> {
  async findAll(): Promise<Product[]> {
    return storageEngine.getAll<Product>(TABLE);
  }

  async findById(id: number): Promise<Product | null> {
    return storageEngine.getById<Product>(TABLE, id);
  }

  async create(
    data: Omit<Product, "id"> & { id?: number }
  ): Promise<Product> {
    return storageEngine.insert<Product>(TABLE, data);
  }

  async update(id: number, patch: Partial<Product>): Promise<Product | null> {
    return storageEngine.update<Product>(TABLE, id, patch);
  }

  async delete(id: number): Promise<boolean> {
    return storageEngine.remove(TABLE, id);
  }

  async findByFarmerId(farmerId: UserId): Promise<Product[]> {
    return storageEngine.query<Product>(TABLE, (p) =>
      sameId(p.farmer_id, farmerId)
    );
  }

  async findActiveByCategory(categoryId: number): Promise<Product[]> {
    return storageEngine.query<Product>(
      TABLE,
      (p) => p.category_id === categoryId && p.status === "active"
    );
  }

  async findByStatus(status: ListingStatus): Promise<Product[]> {
    return storageEngine.query<Product>(TABLE, (p) => p.status === status);
  }

  async findActive(): Promise<Product[]> {
    return this.findByStatus("active");
  }

  async findExpiredActive(todayIsoDate: string): Promise<Product[]> {
    return storageEngine.query<Product>(
      TABLE,
      (p) => p.status === "active" && p.expiry_date < todayIsoDate
    );
  }
}

export const productRepository = new ProductRepository();
