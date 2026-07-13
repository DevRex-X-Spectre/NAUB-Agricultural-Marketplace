import type { PriceHistory } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "price_history" as const;

export class PriceHistoryRepository implements Repository<PriceHistory> {
  async findAll(): Promise<PriceHistory[]> {
    return storageEngine.getAll<PriceHistory>(TABLE);
  }

  async findById(id: number): Promise<PriceHistory | null> {
    return storageEngine.getById<PriceHistory>(TABLE, id);
  }

  async create(
    data: Omit<PriceHistory, "id"> & { id?: number }
  ): Promise<PriceHistory> {
    return storageEngine.insert<PriceHistory>(TABLE, data);
  }

  async update(
    id: number,
    patch: Partial<PriceHistory>
  ): Promise<PriceHistory | null> {
    return storageEngine.update<PriceHistory>(TABLE, id, patch);
  }

  async delete(id: number): Promise<boolean> {
    return storageEngine.remove(TABLE, id);
  }

  async findByCategoryId(categoryId: number): Promise<PriceHistory[]> {
    return storageEngine.query<PriceHistory>(
      TABLE,
      (p) => p.category_id === categoryId
    );
  }

  async findRecent(limit = 100): Promise<PriceHistory[]> {
    const all = await this.findAll();
    return all
      .slice()
      .sort((a, b) => b.recorded_on.localeCompare(a.recorded_on))
      .slice(0, limit);
  }
}

export const priceHistoryRepository = new PriceHistoryRepository();
