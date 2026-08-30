import { describe, it, expect } from "vitest";
import {
  buildDateRange,
  startOfRange,
  endOfRange,
  displayTimestamp,
  DateRangeError,
  nowIso,
} from "@/lib/dates";

describe("lib/dates", () => {
  it("snaps a date-only start to 00:00:00.000 UTC", () => {
    expect(startOfRange("2026-08-01").toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    );
  });

  it("snaps a date-only end to 23:59:59.999 UTC (the old off-by-one)", () => {
    expect(endOfRange("2026-08-31").toISOString()).toBe(
      "2026-08-31T23:59:59.999Z"
    );
  });

  it("includes a record created during the end day", () => {
    const range = buildDateRange("2026-08-01", "2026-08-31");
    const sameDaySale = new Date("2026-08-31T14:30:00.000Z");
    expect(sameDaySale >= range.$gte).toBe(true);
    expect(sameDaySale <= range.$lte).toBe(true);
  });

  it("still honours an explicit timestamp bound", () => {
    const range = buildDateRange(
      "2026-08-01T06:00:00.000Z",
      "2026-08-01T12:00:00.000Z"
    );
    expect(range.$gte.toISOString()).toBe("2026-08-01T06:00:00.000Z");
    expect(range.$lte.toISOString()).toBe("2026-08-01T12:00:00.000Z");
  });

  it("rejects missing, invalid and inverted ranges", () => {
    expect(() => buildDateRange(undefined, "2026-08-01")).toThrow(DateRangeError);
    expect(() => buildDateRange("2026-08-01", "")).toThrow(DateRangeError);
    expect(() => buildDateRange("nonsense", "2026-08-01")).toThrow(DateRangeError);
    expect(() => buildDateRange("2026-08-31", "2026-08-01")).toThrow(
      DateRangeError
    );
  });

  it("prefers createdAt and returns ISO-8601", () => {
    const iso = displayTimestamp({
      createdAt: new Date("2026-08-30T01:02:03.000Z"),
      createdTime: "8/30/2026, 9:02:03 AM",
    });
    expect(iso).toBe("2026-08-30T01:02:03.000Z");
  });

  it("falls back to legacy createdTime when createdAt is absent", () => {
    const iso = displayTimestamp({ createdTime: "2026-08-30T01:02:03.000Z" });
    expect(iso).toBe("2026-08-30T01:02:03.000Z");
  });

  it("returns an unparseable legacy string as-is rather than losing it", () => {
    const out = displayTimestamp({ createdTime: "not a real date" });
    expect(out).toBe("not a real date");
  });

  it("returns null when there is no timestamp at all", () => {
    expect(displayTimestamp({})).toBeNull();
  });

  it("nowIso produces a parseable ISO string", () => {
    expect(Number.isNaN(new Date(nowIso()).getTime())).toBe(false);
  });
});
