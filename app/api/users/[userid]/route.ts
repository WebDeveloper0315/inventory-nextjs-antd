import { connectDB } from "@/config/dbConfig";
import { validateJWT } from "@/helpers/validateJWT";
import { errorResponse } from "@/helpers/auth";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

// In Next 15+, dynamic route `params` is async and must be awaited.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userid: string }> }
) {
  try {
    await validateJWT(request);
    await connectDB();

    const { userid } = await params;
    const user = await User.findById(userid).select("-password");
    if (!user) {
      return NextResponse.json({ message: "No user found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User data fetched successfully",
      data: user,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
