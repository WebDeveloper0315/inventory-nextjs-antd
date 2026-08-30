import mongoose from "mongoose";

/**
 * Cached connection singleton. Next.js route handlers (and dev HMR) import this
 * module many times; without caching, each import opened a brand-new
 * connection. We reuse a single connection stored on the global object.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = global as unknown as { _mongoose?: MongooseCache };

const cached: MongooseCache =
  globalForMongoose._mongoose || { conn: null, promise: null };

globalForMongoose._mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.DB_URI;
    if (!uri) {
      throw new Error("DB_URI environment variable is not set");
    }
    cached.promise = mongoose.connect(uri).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
