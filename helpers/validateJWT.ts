import { NextRequest } from "next/server";
import { AuthError, verifyToken, COOKIE_NAME } from "@/lib/jwt";

/**
 * Verifies the auth cookie and returns the userId.
 *
 * IMPORTANT: this THROWS `AuthError` when there is no valid token. Callers must
 * catch it and return a 401 (use `errorResponse` from `helpers/auth.ts`).
 *
 * Unlike the old implementation, it no longer swallows errors and no longer
 * mutates cookies as a side effect — that made every "protected" route
 * effectively public.
 */
export const validateJWT = async (request: NextRequest): Promise<string> => {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    throw new AuthError("No authentication token found");
  }
  const payload = await verifyToken(token);
  return payload.userId;
};
