import Decimal from "decimal.js";
import { Types } from "mongoose";

/**
 * Money helpers. Prices are stored in MongoDB as Decimal128 (exact decimal),
 * and all money arithmetic goes through decimal.js so there is no
 * floating-point drift. Convert to a plain number only at the JSON boundary,
 * where a rounded display value is expected.
 */

export type MoneyInput =
  | number
  | string
  | Decimal
  | Types.Decimal128
  | null
  | undefined;

/** Parse any money-ish value into a Decimal (null/undefined/"" → 0). */
export function toDecimal(v: MoneyInput): Decimal {
  if (v === null || v === undefined || v === "") {
    return new Decimal(0);
  }
  // number, Decimal, and Decimal128 all stringify to a parseable decimal.
  return new Decimal(v.toString());
}

/** Convert a Decimal/number/string into a Decimal128 for storage. */
export function toDecimal128(v: Decimal | number | string): Types.Decimal128 {
  const d = v instanceof Decimal ? v : new Decimal(String(v));
  return Types.Decimal128.fromString(d.toString());
}

/**
 * Convert a money value to a plain JS number for JSON responses, rounded to
 * `dp` decimal places (default 2). Use this for API output only, never for
 * intermediate arithmetic.
 */
export function toNumber(v: MoneyInput, dp = 2): number {
  return Number(toDecimal(v).toFixed(dp));
}

export { Decimal };
