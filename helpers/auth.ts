import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/dbConfig";
import User from "@/models/userModel";
import { validateJWT } from "@/helpers/validateJWT";
import { AuthError } from "@/lib/jwt";
import { ValidationError } from "@/helpers/validate";
import { DateRangeError } from "@/lib/dates";

export type PermissionKey =
  | "newProduct"
  | "sold"
  | "returning"
  | "query"
  | "addUser";

/**
 * Verifies the token AND loads the user document. Throws AuthError if the token
 * is invalid or the user no longer exists. NOTE: imports Mongoose, so this must
 * only be used from Node.js route handlers — never from Edge middleware.
 */
export async function requireUser(request: NextRequest) {
  const userId = await validateJWT(request);
  await connectDB();
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AuthError("User no longer exists");
  }
  return user;
}

/** Like requireUser, but also asserts the user holds a given permission. */
export async function requirePermission(
  request: NextRequest,
  permission: PermissionKey
) {
  const user = await requireUser(request);
  if (!(user as any)[permission]) {
    throw new AuthError(`Missing required permission: ${permission}`);
  }
  return user;
}

/**
 * Maps a caught error to a safe response: 401 for auth failures, 500 otherwise,
 * without leaking internal error messages to the client.
 */
export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
  if (error instanceof ValidationError || error instanceof DateRangeError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json(
    { message: "Something went wrong" },
    { status: 500 }
  );
}
