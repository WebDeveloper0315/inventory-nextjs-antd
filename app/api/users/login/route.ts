import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
connectDB();

// export async function GET(request: NextRequest) {
//     return NextResponse.json({
//       message: "users/register api accessed with get method",
//     })
//   }

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    //check if user exists
    const user = await User.findOne({ name: reqBody.name });
    console.log(reqBody.name)
    if (!user) {
      throw new Error("User does not exists");
    }

    //compare password
    const validPassword = await bcrypt.compare(reqBody.password, user.password);

    if (!validPassword) {
      throw new Error("Invalid password");
    }

    //create token
    const dataToBeSigned = {
      userId: user._id,
      email: user.name,
    };

    const token = jwt.sign(dataToBeSigned, process.env.jwt_secret!, {
      expiresIn: "1h",
    });

    const response = NextResponse.json({message: "Login successful"}, {status: 200})

    //set cookie
    response.cookies.set("token", token, {
        httpOnly: true,
        maxAge: 60 * 60  * 1000, //1 hour
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// export async function PUT(request: NextRequest) {
//     return NextResponse.json({
//       message: "users/register api accessed with put method",
//     })
// }
