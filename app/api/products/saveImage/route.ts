import { extname, join } from "path";
import { stat, mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, errorResponse } from "@/helpers/auth";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    // Only users who can create products may upload product images.
    await requirePermission(request, "newProduct");

    const formData = await request.formData();
    const file = formData.get("image") as unknown as File | null;

    if (!file || typeof (file as any).arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "File blob is required." },
        { status: 400 }
      );
    }

    // Validate type and size BEFORE writing anything to disk.
    const fileExtension = extname((file as any).name || "").toLowerCase();
    if (
      !ALLOWED_EXTENSIONS.has(fileExtension) ||
      !ALLOWED_MIME.has((file as any).type)
    ) {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 5 MB)." },
        { status: 413 }
      );
    }
    const buffer = Buffer.from(arrayBuffer);

    const PATH = process.env.NEXT_PUBLIC_IMAGES_PATH;
    if (!PATH) {
      throw new Error("NEXT_PUBLIC_IMAGES_PATH is not defined");
    }

    const pathDist: string = join(process.cwd(), "public/", PATH);

    try {
      await stat(pathDist);
    } catch (e: any) {
      if (e.code === "ENOENT") {
        await mkdir(pathDist, { recursive: true });
      } else {
        console.error("Error creating upload directory", e);
        return NextResponse.json(
          { error: "Something went wrong." },
          { status: 500 }
        );
      }
    }

    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const originalFilename = ((file as any).name || "image").replace(
      /\.[^/.]+$/,
      ""
    );
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const fileExtName = `${sanitizedFilename}_${uniqueSuffix}${fileExtension}`;

    await writeFile(`${pathDist}/${fileExtName}`, buffer);

    const finalFilePath = "productImage/" + `${fileExtName}`;
    return NextResponse.json(
      { done: "ok", filename: fileExtName, httpfilepath: finalFilePath },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
