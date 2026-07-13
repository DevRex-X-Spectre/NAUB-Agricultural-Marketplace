import type { ContactRequest, UserId } from "@/lib/types";
import { sameId } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "contact_requests" as const;

export class ContactRequestRepository implements Repository<ContactRequest> {
  async findAll(): Promise<ContactRequest[]> {
    return storageEngine.getAll<ContactRequest>(TABLE);
  }

  async findById(id: number): Promise<ContactRequest | null> {
    return storageEngine.getById<ContactRequest>(TABLE, id);
  }

  async create(
    data: Omit<ContactRequest, "id"> & { id?: number }
  ): Promise<ContactRequest> {
    return storageEngine.insert<ContactRequest>(TABLE, data);
  }

  async update(
    id: number,
    patch: Partial<ContactRequest>
  ): Promise<ContactRequest | null> {
    return storageEngine.update<ContactRequest>(TABLE, id, patch);
  }

  async delete(id: number): Promise<boolean> {
    return storageEngine.remove(TABLE, id);
  }

  async findByBuyerId(buyerId: UserId): Promise<ContactRequest[]> {
    return storageEngine.query<ContactRequest>(TABLE, (r) =>
      sameId(r.buyer_id, buyerId)
    );
  }

  async findByFarmerId(farmerId: UserId): Promise<ContactRequest[]> {
    return storageEngine.query<ContactRequest>(TABLE, (r) =>
      sameId(r.farmer_id, farmerId)
    );
  }

  async findByProductId(productId: number): Promise<ContactRequest[]> {
    return storageEngine.query<ContactRequest>(
      TABLE,
      (r) => r.product_id === productId
    );
  }

  async findCompletedForBuyerProduct(
    buyerId: UserId,
    productId: number
  ): Promise<ContactRequest | null> {
    const rows = await storageEngine.query<ContactRequest>(
      TABLE,
      (r) =>
        sameId(r.buyer_id, buyerId) &&
        r.product_id === productId &&
        r.status === "completed"
    );
    return rows[0] ?? null;
  }
}

export const contactRequestRepository = new ContactRequestRepository();
