import { describe, it, expect } from "vitest";
import {
  parseOrThrow,
  ValidationError,
  loginSchema,
  productRegisterSchema,
  recordingSchema,
} from "@/helpers/validate";

describe("helpers/validate", () => {
  it("accepts a valid login payload", () => {
    const out = parseOrThrow(loginSchema, { name: "alice", password: "pw" });
    expect(out.name).toBe("alice");
  });

  it("rejects a login payload missing the password", () => {
    expect(() => parseOrThrow(loginSchema, { name: "alice" })).toThrow(
      ValidationError
    );
  });

  it("requires code and location for product registration", () => {
    expect(() =>
      parseOrThrow(productRegisterSchema, { code: "A1" })
    ).toThrow(ValidationError);
    const ok = parseOrThrow(productRegisterSchema, {
      code: "A1",
      location: "Shelf",
      units: "10",
      pricePerUnit: "5",
    });
    expect(ok.code).toBe("A1");
  });

  it("rejects non-numeric values for numeric fields", () => {
    expect(() =>
      parseOrThrow(productRegisterSchema, {
        code: "A1",
        location: "Shelf",
        units: "abc",
      })
    ).toThrow(ValidationError);
  });

  it("treats empty-string numerics as absent (lenient)", () => {
    const ok = parseOrThrow(productRegisterSchema, {
      code: "A1",
      location: "Shelf",
      units: "",
      taxes: "",
    });
    expect(ok.code).toBe("A1");
  });

  it("recording only strictly requires the product code", () => {
    const ok = parseOrThrow(recordingSchema, { code: "A1" });
    expect(ok.code).toBe("A1");
    expect(() => parseOrThrow(recordingSchema, {})).toThrow(ValidationError);
  });
});
