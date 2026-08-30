import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/jwt";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout Successfully" },
    { status: 200 }
  );
  response.cookies.set(clearAuthCookie());
  return response;
}
