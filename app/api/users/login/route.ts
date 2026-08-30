import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";
import { signToken, buildAuthCookie } from "@/lib/jwt";
import { parseOrThrow, loginSchema } from "@/helpers/validate";
import { errorResponse } from "@/helpers/auth";

export async function POST(request: NextRequest) {
  try {
    // Validate the payload BEFORE opening a database connection, so malformed
    // or empty requests are rejected without any DB work.
    const { name, password } = parseOrThrow(loginSchema, await request.json());

    await connectDB();
    const user = await User.findOne({ name });

    // Same generic message whether the user is missing or the password is
    // wrong, so the endpoint cannot be used to enumerate usernames.
    const invalid = NextResponse.json(
      { message: "Invalid name or password" },
      { status: 401 }
    );
    if (!user) return invalid;

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return invalid;

    const token = await signToken(user._id.toString());

    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );
    response.cookies.set(buildAuthCookie(token));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
