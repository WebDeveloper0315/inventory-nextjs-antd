import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";
import { requirePermission, errorResponse } from "@/helpers/auth";
import { parseOrThrow, registerUserSchema } from "@/helpers/validate";

export async function POST(request: NextRequest) {
  try {
    // Only users with the "addUser" permission may create accounts.
    await requirePermission(request, "addUser");
    await connectDB();

    const { name, password, userAuthority } = parseOrThrow(
      registerUserSchema,
      await request.json()
    );

    const authorities: string[] = Array.isArray(userAuthority)
      ? userAuthority
      : [];

    const existing = await User.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      password: hashedPassword,
      newProduct: authorities.includes("newProduct"),
      sold: authorities.includes("sold"),
      returning: authorities.includes("returning"),
      query: authorities.includes("query"),
      addUser: authorities.includes("addUser"),
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User Created Successfully", success: true },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
