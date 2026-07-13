import type { TransportProvider } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "transport_providers" as const;

export class TransportProviderRepository
  implements Repository<TransportProvider>
{
  async findAll(): Promise<TransportProvider[]> {
    return storageEngine.getAll<TransportProvider>(TABLE);
  }

  async findById(id: number): Promise<TransportProvider | null> {
    return storageEngine.getById<TransportProvider>(TABLE, id);
  }

  async create(
    data: Omit<TransportProvider, "id"> & { id?: number }
  ): Promise<TransportProvider> {
    return storageEngine.insert<TransportProvider>(TABLE, data);
  }

  async update(
    id: number,
    patch: Partial<TransportProvider>
  ): Promise<TransportProvider | null> {
    return storageEngine.update<TransportProvider>(TABLE, id, patch);
  }

  async delete(id: number): Promise<boolean> {
    return storageEngine.remove(TABLE, id);
  }

  async findByLga(lga: string): Promise<TransportProvider[]> {
    const needle = lga.toLowerCase();
    return storageEngine.query<TransportProvider>(
      TABLE,
      (t) =>
        t.coverage_lga != null &&
        t.coverage_lga.toLowerCase().includes(needle)
    );
  }
}

export const transportProviderRepository = new TransportProviderRepository();
