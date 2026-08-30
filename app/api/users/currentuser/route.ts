import { connectDB } from "@/config/dbConfig";
import { validateJWT } from "@/helpers/validateJWT";
import { errorResponse } from "@/helpers/auth";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = await validateJWT(request);
    await connectDB();

    const user = await User.findById(userId).select("-password");
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
