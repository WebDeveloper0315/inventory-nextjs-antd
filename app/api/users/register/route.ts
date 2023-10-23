import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcrypt from 'bcryptjs';
connectDB();

// export async function GET(request: NextRequest) {
//     return NextResponse.json({
//       message: "users/register api accessed with get method",
//     })
//   }

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    console.log(reqBody)
    //check if user already exists
    const user = await User.findOne({ name: reqBody.name });
    if (user) {
      throw new Error("User already exists");
    }

    //hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(reqBody.password, salt)
    reqBody.password = hashedPassword

    // create user
    const newUser = new User({
      name: reqBody.name,
      password: reqBody.password,
      newProduct: reqBody.userAuthority.includes('newProduct'),
      sold: reqBody.userAuthority.includes('sold'),
      query: reqBody.userAuthority.includes('query'),
      addUser: reqBody.userAuthority.includes('addUser'),
    })

    await newUser.save()

    // await User.create(reqBody)
    return NextResponse.json(
      { message: "User Created Successfully", success: true },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// export async function PUT(request: NextRequest) {
//     return NextResponse.json({
//       message: "users/register api accessed with put method",
//     })
// }
