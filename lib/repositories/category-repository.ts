import type { Category } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "categories" as const;

export class CategoryRepository implements Repository<Category> {
  async findAll(): Promise<Category[]> {
    return storageEngine.getAll<Category>(TABLE);
  }

  async findById(id: number): Promise<Category | null> {
    return storageEngine.getById<Category>(TABLE, id);
  }

  async create(
    data: Omit<Category, "id"> & { id?: number }
  ): Promise<Category> {
    return storageEngine.insert<Category>(TABLE, data);
  }

  async update(id: number, patch: Partial<Category>): Promise<Category | null> {
    return storageEngine.update<Category>(TABLE, id, patch);
  }

  async delete(id: number): Promise<boolean> {
    return storageEngine.remove(TABLE, id);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const rows = await storageEngine.query<Category>(
      TABLE,
      (c) => c.slug === slug
    );
    return rows[0] ?? null;
  }
}

export const categoryRepository = new CategoryRepository();
