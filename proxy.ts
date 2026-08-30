import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/jwt";

// Pages anyone may reach without a session.
const PUBLIC_PAGES = new Set<string>(["/login"]);
// API routes anyone may call without a session.
const PUBLIC_APIS = new Set<string>(["/api/users/login", "/api/users/logout"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");
  const isPublic = isApi
    ? PUBLIC_APIS.has(pathname)
    : PUBLIC_PAGES.has(pathname);

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isValid = false;
  if (token) {
    try {
      await verifyToken(token);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  // A signed-in user hitting /login gets sent home.
  if (isValid && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (isPublic) {
    return NextResponse.next();
  }

  if (!isValid) {
    if (isApi) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and public static assets.
  // `/api/*` IS included so every API route requires a valid session unless
  // explicitly whitelisted above.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|image/|productImage/).*)",
  ],
};
