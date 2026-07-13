import type { User, UserId, UserRole, VerificationStatus } from "@/lib/types";
import { storageEngine } from "./storage-engine";
import type { Repository } from "./types";

const TABLE = "users" as const;

function toNumericId(id: UserId): number {
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid local user id: ${id}`);
  }
  return n;
}

export class UserRepository implements Repository<User> {
  async findAll(): Promise<User[]> {
    return storageEngine.getAll<User & { id: number }>(TABLE);
  }

  async findById(id: UserId): Promise<User | null> {
    return storageEngine.getById<User & { id: number }>(TABLE, toNumericId(id));
  }

  async create(
    data: Omit<User, "id"> & { id?: UserId }
  ): Promise<User> {
    const id =
      data.id != null ? toNumericId(data.id) : undefined;
    return storageEngine.insert<User & { id: number }>(TABLE, {
      ...data,
      id,
    } as Omit<User & { id: number }, "id"> & { id?: number });
  }

  async update(id: UserId, patch: Partial<User>): Promise<User | null> {
    return storageEngine.update<User & { id: number }>(
      TABLE,
      toNumericId(id),
      patch as Partial<User & { id: number }>
    );
  }

  async delete(id: UserId): Promise<boolean> {
    return storageEngine.remove(TABLE, toNumericId(id));
  }

  async findByPhone(phone: string): Promise<User | null> {
    const normalized = phone.replace(/\s+/g, "");
    const rows = await storageEngine.query<User & { id: number }>(
      TABLE,
      (u) => u.phone.replace(/\s+/g, "") === normalized
    );
    return rows[0] ?? null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return storageEngine.query<User & { id: number }>(
      TABLE,
      (u) => u.role === role
    );
  }

  async findByVerificationStatus(
    status: VerificationStatus
  ): Promise<User[]> {
    return storageEngine.query<User & { id: number }>(
      TABLE,
      (u) => u.verification_status === status
    );
  }
}

export const userRepository = new UserRepository();
