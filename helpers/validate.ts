import { z } from "zod";

/** Thrown when a request body fails schema validation → mapped to HTTP 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(
      first
        ? `${first.path.join(".") || "body"}: ${first.message}`
        : "Invalid request body"
    );
  }
  return result.data;
}

// The frontend sends numbers as form strings ("12"), so accept string|number
// and require it to be a finite number when present.
const numericLike = z
  .union([z.string(), z.number()])
  .refine((v) => v !== "" && Number.isFinite(Number(v)), {
    message: "must be a number",
  });

// Treat "", null and undefined as "not provided" for optional numerics.
const optionalNumeric = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  numericLike.optional()
);

export const loginSchema = z.object({
  name: z.string().min(1, "name is required"),
  password: z.string().min(1, "password is required"),
});

export const registerUserSchema = z
  .object({
    name: z.string().min(1, "name is required"),
    password: z.string().min(1, "password is required"),
    userAuthority: z.array(z.string()).optional(),
  })
  .passthrough();

// Kept lenient on numerics so partially-filled forms are not rejected, but the
// identifiers must be present and anything numeric must actually be numeric.
export const productRegisterSchema = z
  .object({
    code: z.string().min(1, "product code is required"),
    location: z.string().min(1, "location is required"),
    units: optionalNumeric,
    pricePerUnit: optionalNumeric,
    taxes: optionalNumeric,
    market: z.string().optional(),
    imagePath: z.string().optional(),
  })
  .passthrough();

// recording covers buying/selling/returning/lost — only the product code is
// guaranteed across all of them, so keep the rest optional.
export const recordingSchema = z
  .object({
    code: z.string().min(1, "product code is required"),
    location: z.string().optional(),
    units: optionalNumeric,
    pricePerUnit: optionalNumeric,
    taxes: optionalNumeric,
    market: z.string().optional(),
  })
  .passthrough();
