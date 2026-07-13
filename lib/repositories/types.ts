/**
 * Shared Repository contract — frozen for Part B swap.
 */

export interface Repository<T extends { id: number | string }> {
  findAll(): Promise<T[]>;
  findById(id: T["id"]): Promise<T | null>;
  create(
    data: Omit<T, "id"> | (Omit<T, "id"> & { id?: T["id"] })
  ): Promise<T>;
  update(id: T["id"], patch: Partial<T>): Promise<T | null>;
  delete(id: T["id"]): Promise<boolean>;
}
