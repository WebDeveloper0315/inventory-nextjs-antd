import { requireUser, errorResponse } from "@/helpers/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // requireUser verifies the token AND confirms the user still exists,
    // throwing AuthError (-> 401) if either fails.
    //
    // This endpoint answers "who am I?", so a cryptographically valid token
    // whose user record is gone (deleted, or access revoked) is a dead session
    // and must be 401 — not the 404 this route used to return. 404 would say
    // "you are authenticated, the resource merely isn't there", which is both
    // semantically wrong here and lets a revoked user look signed-in.
    //
    // Note this differs deliberately from /api/users/[userid], which fetches an
    // arbitrary user resource: there the caller IS still authenticated, so a
    // missing target user is correctly a 404.
    const user = await requireUser(request);

    return NextResponse.json({
      message: "User data fetched successfully",
      data: user,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
