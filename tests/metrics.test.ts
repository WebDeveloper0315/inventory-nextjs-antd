import { describe, it, expect } from "vitest";
import { calculateMetrics, type RecordingItem } from "@/lib/metrics";

describe("lib/metrics.calculateMetrics", () => {
  const data: RecordingItem[] = [
    { productCode: "A", mode: "buying", pricePerUnit: "0.1", units: 3, taxes: 10 },
    { productCode: "A", mode: "selling", pricePerUnit: "0.2", units: 2, taxes: 10 },
  ];

  it("aggregates totals and averages exactly", () => {
    const m = calculateMetrics(data);
    expect(m.totBuyPrice["A"]).toBe(0.3);
    expect(m.totSellPrice["A"]).toBe(0.4);
    expect(m.totBuyUnits["A"]).toBe(3);
    expect(m.totSellUnits["A"]).toBe(2);
    expect(m.avgBuyPrice["A"]).toBe(0.1);
    expect(m.avgSellPrice["A"]).toBe(0.2);
    expect(m.totBuyTaxes["A"]).toBe(0.03);
    expect(m.totSellTaxes["A"]).toBe(0.04);
  });

  it("computes profit without floating-point drift", () => {
    const m = calculateMetrics(data);
    // 0.4 - 0.3 - 0.04 + 0.03 = 0.09 exactly (float math drifts here).
    expect(m.profitCode["A"]).toBe(0.09);
    expect(m.allProfit).toBe(0.09);
  });

  it("guards divide-by-zero (a product with no buys)", () => {
    const m = calculateMetrics([
      { productCode: "B", mode: "selling", pricePerUnit: "5", units: 4 },
    ]);
    // No buys → avgBuyPrice has no entry, and nothing is NaN.
    expect(m.totSellPrice["B"]).toBe(20);
    expect(Number.isNaN(m.allProfit)).toBe(false);
  });

  it("subtracts returns and trashed value from profit", () => {
    const m = calculateMetrics([
      { productCode: "C", mode: "buying", pricePerUnit: "10", units: 10 },
      { productCode: "C", mode: "selling", pricePerUnit: "15", units: 8 },
      { productCode: "C", mode: "returning", pricePerUnit: "15", units: 1 },
      { productCode: "C", mode: "lost", pricePerUnit: "10", units: 1 },
    ]);
    // sell 120 - buy 100 - returned 15 - trashed 10 = -5 (no taxes)
    expect(m.profitCode["C"]).toBe(-5);
    expect(m.totReturnedUnits["C"]).toBe(1);
    expect(m.totTrashedUnits["C"]).toBe(1);
  });
});
