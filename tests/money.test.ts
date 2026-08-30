import { describe, it, expect } from "vitest";
import { toDecimal, toDecimal128, toNumber } from "@/lib/money";

describe("lib/money", () => {
  it("parses numbers, strings and null/empty", () => {
    expect(toDecimal(1.5).toString()).toBe("1.5");
    expect(toDecimal("2.25").toString()).toBe("2.25");
    expect(toDecimal("").toString()).toBe("0");
    expect(toDecimal(null).toString()).toBe("0");
    expect(toDecimal(undefined).toString()).toBe("0");
  });

  it("does exact decimal arithmetic (no float drift)", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in float; exact here.
    const sum = toDecimal("0.1").plus(toDecimal("0.2"));
    expect(sum.toString()).toBe("0.3");
  });

  it("round-trips through Decimal128", () => {
    const d128 = toDecimal128("19.99");
    expect(d128.toString()).toBe("19.99");
    expect(toNumber(d128)).toBe(19.99);
  });

  it("toNumber rounds to 2 dp by default", () => {
    expect(toNumber("1.005", 2)).toBe(1.01);
    expect(toNumber(toDecimal("2").div(3))).toBe(0.67);
  });
});
