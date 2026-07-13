import type { Review, UserId } from "@/lib/types";
import { sameId } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "reviews" as const;

export class ReviewRepository implements Repository<Review> {
  async findAll(): Promise<Review[]> {
    return storageEngine.getAll<Review>(TABLE);
  }

  async findById(id: number): Promise<Review | null> {
    return storageEngine.getById<Review>(TABLE, id);
  }

  async create(data: Omit<Review, "id"> & { id?: number }): Promise<Review> {
    return storageEngine.insert<Review>(TABLE, data);
  }

  async update(id: number, patch: Partial<Review>): Promise<Review | null> {
    return storageEngine.update<Review>(TABLE, id, patch);
  }

  async delete(id: number): Promise<boolean> {
    return storageEngine.remove(TABLE, id);
  }

  async findByFarmerId(farmerId: UserId): Promise<Review[]> {
    return storageEngine.query<Review>(TABLE, (r) =>
      sameId(r.farmer_id, farmerId)
    );
  }

  async findByProductId(productId: number): Promise<Review[]> {
    return storageEngine.query<Review>(
      TABLE,
      (r) => r.product_id === productId
    );
  }

  async findByBuyerAndProduct(
    buyerId: UserId,
    productId: number
  ): Promise<Review | null> {
    const rows = await storageEngine.query<Review>(
      TABLE,
      (r) => sameId(r.buyer_id, buyerId) && r.product_id === productId
    );
    return rows[0] ?? null;
  }
}

export const reviewRepository = new ReviewRepository();
