/**
 * Date helpers for range queries and API output.
 *
 * Storage rule: the authoritative timestamp on every record is Mongoose's
 * `createdAt` (a real UTC Date). The legacy `createdTime` string field is kept
 * only so older documents still render — new writes store an ISO-8601 string
 * there rather than a locale-formatted one.
 *
 * Range rule: a date-only bound ("YYYY-MM-DD") is interpreted in UTC. The start
 * bound snaps to 00:00:00.000 and the end bound to 23:59:59.999, so a range is
 * INCLUSIVE of both calendar days. This removes the old off-by-one where the
 * whole end day was excluded.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class DateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateRangeError";
  }
}

function parse(value: unknown, label: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new DateRangeError(`${label} is not a valid date`);
    }
    return value;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new DateRangeError(`${label} is required`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new DateRangeError(`${label} is not a valid date`);
  }
  return d;
}

/** Parse the start bound; a date-only value snaps to 00:00:00.000 UTC. */
export function startOfRange(value: unknown): Date {
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return parse(value, "start");
}

/** Parse the end bound; a date-only value snaps to 23:59:59.999 UTC. */
export function endOfRange(value: unknown): Date {
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return new Date(`${value}T23:59:59.999Z`);
  }
  return parse(value, "end");
}

/**
 * Build an inclusive { $gte, $lte } filter from request-supplied bounds.
 * Throws DateRangeError (→ HTTP 400) when a bound is missing/unparseable or
 * the range is inverted.
 */
export function buildDateRange(startInput: unknown, endInput: unknown) {
  if (startInput === undefined || startInput === null || startInput === "") {
    throw new DateRangeError("start is required");
  }
  if (endInput === undefined || endInput === null || endInput === "") {
    throw new DateRangeError("end is required");
  }
  const start = startOfRange(startInput);
  const end = endOfRange(endInput);
  if (start.getTime() > end.getTime()) {
    throw new DateRangeError("start must be on or before end");
  }
  return { $gte: start, $lte: end };
}

/**
 * The timestamp to show for a recording. Prefers the real `createdAt` Date and
 * falls back to the legacy `createdTime` string for documents written before
 * the date cleanup. Returns an ISO-8601 string (or null), which every client
 * can parse reliably — unlike a server-locale string.
 */
export function displayTimestamp(doc: {
  createdAt?: Date | string | null;
  createdTime?: string | null;
}): string | null {
  if (doc.createdAt) {
    const d = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (doc.createdTime) {
    const d = new Date(doc.createdTime);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    // Unparseable legacy locale string — return it as-is rather than losing it.
    return doc.createdTime;
  }
  return null;
}

/** Value to store in the legacy `createdTime` field on new writes. */
export function nowIso(): string {
  return new Date().toISOString();
}
