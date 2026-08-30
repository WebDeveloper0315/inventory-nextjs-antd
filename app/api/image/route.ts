import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import { validateJWT } from "@/helpers/validateJWT";
import { errorResponse } from "@/helpers/auth";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await validateJWT(request);

    const imagesPath = process.env.NEXT_PUBLIC_IMAGES_PATH;
    if (!imagesPath) {
      throw new Error("NEXT_PUBLIC_IMAGES_PATH is not set");
    }

    const key = request.nextUrl.searchParams.get("key");
    if (!key || !key.trim()) {
      return new Response("", { status: 400 });
    }

    // Reject anything that isn't a plain filename — no path separators, no "..".
    // This closes the path-traversal hole (e.g. ?key=../../../etc/passwd).
    if (key.includes("/") || key.includes("\\") || key.includes("..")) {
      return new Response("", { status: 400 });
    }

    const baseDir = path.resolve(path.join("public", imagesPath));
    const resolved = path.resolve(baseDir, key);

    // Defense in depth: ensure the resolved path stays inside baseDir.
    if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) {
      return new Response("", { status: 400 });
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      return new Response("", { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return new Response("", { status: 404 });
    }

    const buffer = await fs.promises.readFile(resolved);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
