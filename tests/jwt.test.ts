import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-value";
});

describe("lib/jwt", () => {
  it("signs and verifies a token round-trip", async () => {
    const { signToken, verifyToken } = await import("@/lib/jwt");
    const token = await signToken("user-123");
    const payload = await verifyToken(token);
    expect(payload.userId).toBe("user-123");
  });

  it("rejects a tampered/garbage token with AuthError", async () => {
    const { verifyToken, AuthError } = await import("@/lib/jwt");
    await expect(verifyToken("not-a-real-token")).rejects.toBeInstanceOf(
      AuthError
    );
  });

  it("rejects a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const { verifyToken, AuthError } = await import("@/lib/jwt");
    const forged = await new SignJWT({ userId: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-different-secret"));
    await expect(verifyToken(forged)).rejects.toBeInstanceOf(AuthError);
  });
});
