import { connectDB } from "@/config/dbConfig";
import { requirePermission, errorResponse } from "@/helpers/auth";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    // Editing users requires the "addUser" permission.
    await requirePermission(request, "addUser");
    await connectDB();

    const reqBody = await request.json();
    const { _id, name, password, newProduct, sold, returning, query, addUser } =
      reqBody ?? {};

    if (!_id) {
      return NextResponse.json(
        { message: "User _id is required" },
        { status: 400 }
      );
    }

    // Only allow a known set of fields to be updated (never blindly spread the
    // request body into the update — that let callers set arbitrary fields).
    const update: Record<string, unknown> = {};
    if (typeof name === "string") update.name = name;
    if (typeof newProduct === "boolean") update.newProduct = newProduct;
    if (typeof sold === "boolean") update.sold = sold;
    if (typeof returning === "boolean") update.returning = returning;
    if (typeof query === "boolean") update.query = query;
    if (typeof addUser === "boolean") update.addUser = addUser;

    // If a new password is supplied, hash it — never store plaintext.
    if (typeof password === "string" && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    const updateUser = await User.findByIdAndUpdate(_id, update, {
      new: true,
    }).select("-password");

    if (!updateUser) {
      return NextResponse.json(
        { message: "No user found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "User data updated successfully",
      data: updateUser,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
