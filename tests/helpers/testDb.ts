import mongoose from "mongoose";

/**
 * Database lifecycle for integration tests.
 *
 * These tests need a REAL MongoDB (they assert on Decimal128 storage and on
 * date-range query semantics, which mocks get wrong). Resolution order:
 *
 *   1. `TEST_DB_URI` env var — point it at any throwaway database, e.g.
 *      TEST_DB_URI='mongodb://127.0.0.1:27017/inventory-test' npm run test:int
 *   2. `mongodb-memory-server`, if installed and able to provide a binary.
 *
 * If neither is available the DB-backed suites SKIP rather than fail, so
 * `npm test` still works on a machine (or CI runner) without MongoDB.
 * `tests/routes.auth.test.ts` needs no database and always runs.
 */

let memoryServer: { stop: () => Promise<unknown> } | null = null;
let connected = false;

/** Returns a usable Mongo URI, or null if no database is available. */
export async function resolveTestUri(): Promise<string | null> {
  if (process.env.TEST_DB_URI) {
    return process.env.TEST_DB_URI;
  }
  try {
    // Optional dependency — only used when it can actually supply a binary.
    const mod: any = await import("mongodb-memory-server");
    const server = await mod.MongoMemoryServer.create();
    memoryServer = server;
    return server.getUri();
  } catch {
    return null;
  }
}

/**
 * Connect for a test suite. Returns false when no database is available, so
 * the caller can skip.
 */
export async function connectTestDb(): Promise<boolean> {
  const uri = await resolveTestUri();
  if (!uri) return false;

  // The app's connectDB() reads DB_URI, so point it at the test database.
  process.env.DB_URI = uri;
  await mongoose.connect(uri);
  connected = true;
  return true;
}

export async function disconnectTestDb(): Promise<void> {
  if (connected) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
    connected = false;
  }
  if (memoryServer) {
    await memoryServer.stop().catch(() => {});
    memoryServer = null;
  }
}

/** Wipe every collection between tests so cases stay independent. */
export async function clearCollections(): Promise<void> {
  if (!connected || !mongoose.connection.db) return;
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}
