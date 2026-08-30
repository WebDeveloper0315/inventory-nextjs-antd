import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { makeRequest, readJson, tokenFor, ALL_PERMISSIONS, NO_PERMISSIONS } from "./helpers/request";
import { connectTestDb, disconnectTestDb, clearCollections } from "./helpers/testDb";

/**
 * End-to-end route tests against a REAL MongoDB.
 *
 * Requires a database — set TEST_DB_URI, or install mongodb-memory-server.
 * When neither is available the whole suite skips (see tests/helpers/testDb.ts),
 * so `npm test` still passes on a machine without MongoDB.
 */

let hasDb = false;

beforeAll(async () => {
  process.env.JWT_SECRET = "integration-test-secret";
  process.env.NEXT_PUBLIC_IMAGES_PATH = "/productImage";
  hasDb = await connectTestDb();
}, 120_000);

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  if (hasDb) await clearCollections();
});

/**
 * Declares a test that skips when no database is available.
 *
 * Written with an explicit signature rather than `Parameters<typeof it>`:
 * vitest's `it` is overloaded, and that helper resolved to the
 * `(name, options, fn)` overload, which typed the callback as `TestOptions`.
 */
function itDb(name: string, fn: () => Promise<void>, timeout = 30_000) {
  // `ctx` is intentionally not annotated: in vitest 2 `TestContext` is an empty
  // augmentation interface and `skip()` lives on `TaskContext`, so inference
  // from this overload gives the correct combined type.
  return it(
    name,
    async (ctx) => {
      if (!hasDb) {
        ctx.skip();
        return;
      }
      await fn();
    },
    timeout
  );
}

async function createUser(name: string, password: string, permissions: object) {
  const { default: User } = await import("@/models/userModel");
  const hashed = await bcrypt.hash(password, 10);
  return User.create({ name, password: hashed, ...permissions });
}

describe("login → session", () => {
  itDb("rejects a wrong password with 401 and no cookie", async () => {
    await createUser("alice", "correct-horse", ALL_PERMISSIONS);
    const { POST } = await import("@/app/api/users/login/route");
    const res = await POST(
      makeRequest("/api/users/login", {
        method: "POST",
        body: { name: "alice", password: "wrong" },
      })
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie") ?? "").not.toMatch(/token=[^;]+/);
  });

  itDb("gives the same message for unknown user and wrong password", async () => {
    await createUser("alice", "correct-horse", ALL_PERMISSIONS);
    const { POST } = await import("@/app/api/users/login/route");

    const wrongPw = await readJson(
      await POST(makeRequest("/api/users/login", { method: "POST", body: { name: "alice", password: "nope" } }))
    );
    const noUser = await readJson(
      await POST(makeRequest("/api/users/login", { method: "POST", body: { name: "ghost", password: "nope" } }))
    );
    expect(wrongPw.message).toBe(noUser.message);
  });

  itDb("sets an httpOnly cookie on success", async () => {
    await createUser("alice", "correct-horse", ALL_PERMISSIONS);
    const { POST } = await import("@/app/api/users/login/route");
    const res = await POST(
      makeRequest("/api/users/login", {
        method: "POST",
        body: { name: "alice", password: "correct-horse" },
      })
    );
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/token=[^;]+/);
    expect(cookie).toMatch(/HttpOnly/i);
  });
});

describe("permission enforcement", () => {
  itDb("a user without `addUser` cannot create users (403-class → 401)", async () => {
    const user = await createUser("bob", "pw", NO_PERMISSIONS);
    const token = await tokenFor(user._id.toString());
    const { POST } = await import("@/app/api/users/register/route");
    const res = await POST(
      makeRequest("/api/users/register", {
        method: "POST",
        body: { name: "mallory", password: "pw", userAuthority: ["addUser"] },
        token,
      })
    );
    expect(res.status).toBe(401);

    const { default: User } = await import("@/models/userModel");
    expect(await User.findOne({ name: "mallory" })).toBeNull();
  });

  itDb("a user with `addUser` can create users, and the password is hashed", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    const { POST } = await import("@/app/api/users/register/route");
    const res = await POST(
      makeRequest("/api/users/register", {
        method: "POST",
        body: { name: "carol", password: "s3cret", userAuthority: ["query"] },
        token,
      })
    );
    expect(res.status).toBe(201);

    const { default: User } = await import("@/models/userModel");
    const carol: any = await User.findOne({ name: "carol" });
    expect(carol).not.toBeNull();
    expect(carol.password).not.toBe("s3cret");
    expect(carol.query).toBe(true);
    expect(carol.addUser).toBe(false);
  });

  itDb("a user without `query` cannot read reports", async () => {
    const user = await createUser("bob", "pw", NO_PERMISSIONS);
    const token = await tokenFor(user._id.toString());
    const { GET } = await import("@/app/api/products/queryOne/route");
    const res = await GET(makeRequest("/api/products/queryOne?popCode=A1", { token }));
    expect(res.status).toBe(401);
  });

  itDb("a deleted user's still-valid token is rejected", async () => {
    const user = await createUser("ghost", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(user._id.toString());
    const { default: User } = await import("@/models/userModel");
    await User.deleteOne({ _id: user._id });

    const { GET } = await import("@/app/api/users/currentuser/route");
    const res = await GET(makeRequest("/api/users/currentuser", { token }));
    expect(res.status).toBe(401);
  });
});

describe("money is stored and returned exactly", () => {
  itDb("product registration stores pricePerUnit as Decimal128", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    const { POST } = await import("@/app/api/products/register/route");

    const res = await POST(
      makeRequest("/api/products/register", {
        method: "POST",
        body: {
          code: "A1",
          imagePath: "a.png",
          units: "10",
          pricePerUnit: "0.1",
          location: "Shelf",
          market: "M",
          taxes: "10",
        },
        token,
      })
    );
    expect(res.status).toBe(201);

    const { default: Product } = await import("@/models/productModel");
    const doc: any = await Product.findOne({ productCode: "A1" }).lean();
    expect(doc.pricePerUnit._bsontype).toBe("Decimal128");
    expect(doc.pricePerUnit.toString()).toBe("0.1");
  });

  itDb("weighted-average cost stays exact across buys", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    const { POST: register } = await import("@/app/api/products/register/route");
    const { POST: recording } = await import("@/app/api/products/recording/route");

    await register(
      makeRequest("/api/products/register", {
        method: "POST",
        body: { code: "B1", imagePath: "b.png", units: "1", pricePerUnit: "0.1", location: "L", market: "M", taxes: "0" },
        token,
      })
    );
    // Buy 2 more at 0.2 → weighted avg = (0.1*1 + 0.2*2) / 3 = 0.5/3
    const res = await recording(
      makeRequest("/api/products/recording?buying=1", {
        method: "POST",
        body: { code: "B1", units: "2", pricePerUnit: "0.2", location: "L", market: "M", taxes: "0" },
        token,
      })
    );
    expect(res.status).toBe(201);

    const { default: Stock } = await import("@/models/stockModel");
    const stock: any = await Stock.findOne({ productCode: "B1", location: "L" }).lean();
    expect(stock.stocks).toBe(3);
    // Exact decimal division, not a float artifact.
    expect(Number(stock.pricePerUnit.toString())).toBeCloseTo(0.5 / 3, 12);
  });

  itDb("selling more than stock is refused", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    const { POST: register } = await import("@/app/api/products/register/route");
    const { POST: recording } = await import("@/app/api/products/recording/route");

    await register(
      makeRequest("/api/products/register", {
        method: "POST",
        body: { code: "C1", imagePath: "c.png", units: "5", pricePerUnit: "1", location: "L", market: "M", taxes: "0" },
        token,
      })
    );
    const res = await recording(
      makeRequest("/api/products/recording?selling=1", {
        method: "POST",
        body: { code: "C1", units: "999", pricePerUnit: "2", location: "L(x)", market: "M", taxes: "0" },
        token,
      })
    );
    expect(res.status).toBe(400);
  });

  itDb("queryOne returns numeric money, never NaN, with no sales", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    const { POST: register } = await import("@/app/api/products/register/route");
    await register(
      makeRequest("/api/products/register", {
        method: "POST",
        body: { code: "D1", imagePath: "d.png", units: "5", pricePerUnit: "3", location: "L", market: "M", taxes: "0" },
        token,
      })
    );

    const { GET } = await import("@/app/api/products/queryOne/route");
    const json = await readJson(await GET(makeRequest("/api/products/queryOne?popCode=D1", { token })));
    expect(Number.isNaN(json.averageSellPrice)).toBe(false);
    expect(Number.isNaN(json.profitProduct)).toBe(false);
    expect(json.averageBuyPrice).toBe(3);
  });
});

describe("selling-history date range", () => {
  async function seedSale(code: string, at: Date) {
    const { default: Recording } = await import("@/models/recordingModel");
    // Insert through the native driver so Mongoose's `timestamps` option
    // cannot overwrite the `createdAt` we are pinning for the test.
    await Recording.collection.insertOne({
      productCode: code,
      mode: "selling",
      pricePerUnit: mongoose.Types.Decimal128.fromString("5"),
      units: 1,
      market: "M",
      taxes: 0,
      location: "L",
      createdTime: at.toISOString(),
      createdAt: at,
      updatedAt: at,
    } as any);
  }

  itDb("includes a sale made during the END day (the old off-by-one)", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    await seedSale("E1", new Date("2026-08-31T14:30:00.000Z"));

    const { POST } = await import("@/app/api/products/history/route");
    const json = await readJson(
      await POST(
        makeRequest("/api/products/history?returning=E1", {
          method: "POST",
          body: { start: "2026-08-01", end: "2026-08-31" },
          token,
        })
      )
    );
    expect(json.data.historyData).toHaveLength(1);
  });

  itDb("excludes a sale outside the range", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    await seedSale("E2", new Date("2026-09-01T00:00:01.000Z"));

    const { POST } = await import("@/app/api/products/history/route");
    const json = await readJson(
      await POST(
        makeRequest("/api/products/history?returning=E2", {
          method: "POST",
          body: { start: "2026-08-01", end: "2026-08-31" },
          token,
        })
      )
    );
    expect(json.data.historyData).toHaveLength(0);
  });

  itDb("returns ISO-8601 timestamps the client can parse", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    await seedSale("E3", new Date("2026-08-15T10:00:00.000Z"));

    const { POST } = await import("@/app/api/products/history/route");
    const json = await readJson(
      await POST(
        makeRequest("/api/products/history?returning=E3", {
          method: "POST",
          body: { start: "2026-08-01", end: "2026-08-31" },
          token,
        })
      )
    );
    const ts = json.data.historyData[0].createdAt;
    expect(Number.isNaN(new Date(ts).getTime())).toBe(false);
    expect(ts).toBe("2026-08-15T10:00:00.000Z");
  });

  itDb("rejects an inverted range with 400", async () => {
    const admin = await createUser("admin", "pw", ALL_PERMISSIONS);
    const token = await tokenFor(admin._id.toString());
    const { POST } = await import("@/app/api/products/history/route");
    const res = await POST(
      makeRequest("/api/products/history?returning=E4", {
        method: "POST",
        body: { start: "2026-08-31", end: "2026-08-01" },
        token,
      })
    );
    expect(res.status).toBe(400);
  });
});
