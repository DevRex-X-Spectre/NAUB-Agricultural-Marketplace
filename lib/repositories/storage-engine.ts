/**
 * Internal localStorage storage engine.
 * NOT for import outside lib/repositories/ — repositories are the only consumers.
 *
 * All methods return Promises even though localStorage is sync, so call sites
 * already look like network I/O and Part B can swap in fetch() without changes.
 */

import { STORAGE_NAMESPACE } from "@/lib/config";

export type TableName =
  | "users"
  | "categories"
  | "products"
  | "contact_requests"
  | "reviews"
  | "price_history"
  | "transport_providers";

type RecordWithId = { id: number };

function tableKey(table: TableName): string {
  return `${STORAGE_NAMESPACE}:${table}`;
}

function counterKey(table: TableName): string {
  return `${STORAGE_NAMESPACE}:${table}:_seq`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw<T>(table: TableName): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(tableKey(table));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw<T>(table: TableName, rows: T[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(tableKey(table), JSON.stringify(rows));
}

function nextId(table: TableName): number {
  if (!isBrowser()) return 1;
  const key = counterKey(table);
  const current = parseInt(window.localStorage.getItem(key) ?? "0", 10);
  const next = (Number.isFinite(current) ? current : 0) + 1;
  window.localStorage.setItem(key, String(next));
  return next;
}

/** Reset auto-increment sequence (used by seed / tests) */
export function resetSequence(table: TableName, value = 0): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(counterKey(table), String(value));
}

/** Force sequence to at least max existing id (after bulk seed with fixed ids) */
export function ensureSequenceAtLeast(table: TableName, minValue: number): void {
  if (!isBrowser()) return;
  const key = counterKey(table);
  const current = parseInt(window.localStorage.getItem(key) ?? "0", 10);
  if (!Number.isFinite(current) || current < minValue) {
    window.localStorage.setItem(key, String(minValue));
  }
}

export const storageEngine = {
  async getAll<T extends RecordWithId>(table: TableName): Promise<T[]> {
    return readRaw<T>(table);
  },

  async getById<T extends RecordWithId>(
    table: TableName,
    id: number
  ): Promise<T | null> {
    const rows = readRaw<T>(table);
    return rows.find((r) => r.id === id) ?? null;
  },

  async insert<T extends RecordWithId>(
    table: TableName,
    record: Omit<T, "id"> & { id?: number }
  ): Promise<T> {
    const rows = readRaw<T>(table);
    const id = record.id ?? nextId(table);
    if (record.id != null) {
      ensureSequenceAtLeast(table, record.id);
    }
    const row = { ...record, id } as T;
    rows.push(row);
    writeRaw(table, rows);
    return row;
  },

  async update<T extends RecordWithId>(
    table: TableName,
    id: number,
    patch: Partial<T>
  ): Promise<T | null> {
    const rows = readRaw<T>(table);
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return null;
    const updated = { ...rows[index], ...patch, id } as T;
    rows[index] = updated;
    writeRaw(table, rows);
    return updated;
  },

  async remove(table: TableName, id: number): Promise<boolean> {
    const rows = readRaw<RecordWithId>(table);
    const next = rows.filter((r) => r.id !== id);
    if (next.length === rows.length) return false;
    writeRaw(table, next);
    return true;
  },

  async query<T extends RecordWithId>(
    table: TableName,
    predicate: (row: T) => boolean
  ): Promise<T[]> {
    return readRaw<T>(table).filter(predicate);
  },

  async clear(table: TableName): Promise<void> {
    if (!isBrowser()) return;
    window.localStorage.removeItem(tableKey(table));
    window.localStorage.removeItem(counterKey(table));
  },

  async replaceAll<T extends RecordWithId>(
    table: TableName,
    rows: T[]
  ): Promise<void> {
    writeRaw(table, rows);
    const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
    ensureSequenceAtLeast(table, maxId);
  },
};
