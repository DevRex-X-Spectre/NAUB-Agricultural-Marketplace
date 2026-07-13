/**
 * Test/seed helpers for wiping local tables.
 * Not used by UI — only seed and dev tools.
 */
import { storageEngine, type TableName } from "./storage-engine";

const ALL_TABLES: TableName[] = [
  "users",
  "categories",
  "products",
  "contact_requests",
  "reviews",
  "price_history",
  "transport_providers",
];

export async function clearAllTables(): Promise<void> {
  await Promise.all(ALL_TABLES.map((t) => storageEngine.clear(t)));
}
