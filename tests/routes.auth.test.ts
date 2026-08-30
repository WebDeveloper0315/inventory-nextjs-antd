import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { makeRequest, readJson } from "./helpers/request";

/**
 * Auth-enforcement tests for the API routes.
 *
 * These need NO database: `validateJWT` runs before `connectDB()` in every
 * protected route, so an unauthenticated request is rejected before any DB
 * access. That makes this suite a fast, dependency-free regression guard for
 * exactly the vulnerability that was fixed — routes that used to continue
 * happily when the token was missing or invalid.
 */

beforeAll(() => {
  process.env.JWT_SECRET = "integration-test-secret";
  process.env.DB_URI = "mongodb://127.0.0.1:27017/should-never-be-reached";
  process.env.NEXT_PUBLIC_IMAGES_PATH = "/productImage";
});

// [label, module path, HTTP method, url, body?]
const PROTECTED_ROUTES: Array<[string, string, string, string, unknown?]> = [
  ["GET /api/users/currentuser", "@/app/api/users/currentuser/route", "GET", "/api/users/currentuser"],
  ["PUT /api/users", "@/app/api/users/route", "PUT", "/api/users", { _id: "x" }],
  ["POST /api/users/register", "@/app/api/users/register/route", "POST", "/api/users/register", { name: "x", password: "y" }],
  ["POST /api/products/register", "@/app/api/products/register/route", "POST", "/api/products/register", { code: "A1", location: "L" }],
  ["GET /api/products/register", "@/app/api/products/register/route", "GET", "/api/products/register?productCode=A1"],
  ["POST /api/products/stock", "@/app/api/products/stock/route", "POST", "/api/products/stock", { code: "A1" }],
  ["GET /api/products/check", "@/app/api/products/check/route", "GET", "/api/products/check?code=A1"],
  ["POST /api/products/recording", "@/app/api/products/recording/route", "POST", "/api/products/recording?buying=1", { code: "A1" }],
  ["GET /api/products/queryOne", "@/app/api/products/queryOne/route", "GET", "/api/products/queryOne?popCode=A1"],
  ["GET /api/products/queryAll", "@/app/api/products/queryAll/route", "GET", "/api/products/queryAll?year=2026"],
  ["POST /api/products/history", "@/app/api/products/history/route", "POST", "/api/products/history?returning=A1", { start: "2026-01-01", end: "2026-12-31" }],
  ["POST /api/products/saveImage", "@/app/api/products/saveImage/route", "POST", "/api/products/saveImage"],
  ["GET /api/image", "@/app/api/image/route", "GET", "/api/image?key=x.png"],
  ["GET /api/locations", "@/app/api/locations/route", "GET", "/api/locations"],
  ["POST /api/locations", "@/app/api/locations/route", "POST", "/api/locations", { status: "description" }],
];

async function callRoute(
  modulePath: string,
  method: string,
  url: string,
  body: unknown,
  cookieOpts: { token?: string; rawCookie?: string }
) {
  const mod: any = await import(modulePath);
  const handler = mod[method];
  if (!handler) throw new Error(`${modulePath} has no ${method} export`);
  const req = makeRequest(url, { method, body, ...cookieOpts });
  return handler(req, { params: Promise.resolve({}) });
}

describe("API routes reject unauthenticated requests", () => {
  it.each(PROTECTED_ROUTES)(
    "%s returns 401 with no token",
    async (_label, modulePath, method, url, body) => {
      const res = await callRoute(modulePath, method, url, body, {});
      expect(res.status).toBe(401);
    }
  );

  it.each(PROTECTED_ROUTES)(
    "%s returns 401 with a garbage token",
    async (_label, modulePath, method, url, body) => {
      const res = await callRoute(modulePath, method, url, body, {
        rawCookie: "token=not-a-valid-jwt",
      });
      expect(res.status).toBe(401);
    }
  );

  it("rejects a token signed with the wrong secret (forgery)", async () => {
    const forged = await new SignJWT({ userId: "507f1f77bcf86cd799439011" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("attacker-chosen-secret"));

    const res = await callRoute(
      "@/app/api/users/currentuser/route",
      "GET",
      "/api/users/currentuser",
      undefined,
      { token: forged }
    );
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ userId: "507f1f77bcf86cd799439011" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    const res = await callRoute(
      "@/app/api/users/currentuser/route",
      "GET",
      "/api/users/currentuser",
      undefined,
      { token: expired }
    );
    expect(res.status).toBe(401);
  });

  it("does not leak the reason in a way that enumerates users", async () => {
    const res = await callRoute(
      "@/app/api/users/currentuser/route",
      "GET",
      "/api/users/currentuser",
      undefined,
      {}
    );
    const json = await readJson(res);
    expect(res.status).toBe(401);
    expect(JSON.stringify(json)).not.toMatch(/mongo|stack|at Object|\/home\//i);
  });
});

describe("login route", () => {
  it("is reachable without a token but rejects an empty payload with 400", async () => {
    const mod: any = await import("@/app/api/users/login/route");
    const req = makeRequest("/api/users/login", { method: "POST", body: {} });
    const res = await mod.POST(req);
    // 400 (bad payload) — crucially NOT 401/500, i.e. the route is public.
    expect(res.status).toBe(400);
  });
});

describe("logout route", () => {
  it("clears the auth cookie", async () => {
    const mod: any = await import("@/app/api/users/logout/route");
    const res = await mod.POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/token=/);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});
