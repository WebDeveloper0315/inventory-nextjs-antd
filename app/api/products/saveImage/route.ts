import { extname, join } from "path";
import { stat, mkdir, writeFile } from "fs/promises";
import * as dateFn from "date-fns";
import { NextRequest, NextResponse } from "next/server";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.]/g, "_");
}

export async function POST(request: NextRequest, res: any) {
  const formData = await request.formData();

  const file = formData.get("image") as Blob | null;
  if (!file) {
    return NextResponse.json(
      { error: "File blob is required." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const pathDist: string = join(process.cwd(), "/public/productImage");
  //   const relativeUploadDir = `${dateFn.format(Date.now(), "dd-MM-Y")}`;
  //   const uploadDir = join(pathDist, relativeUploadDir);

  try {
    await stat(pathDist);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      await mkdir(pathDist, { recursive: true });
    } else {
      console.error(
        "Error while trying to create directory when uploading a file\n",
        e
      );
      return NextResponse.json(
        { error: "Something went wrong." },
        { status: 500 }
      );
    }
  }

  try {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const fileExtension = extname(file.name);
    const originalFilename = file.name.replace(/\.[^/.]+$/, "");
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const filename = `${sanitizedFilename}_${uniqueSuffix}${fileExtension}`;
    console.log('filename : ' + filename);
    await writeFile(`${pathDist}/${filename}`, buffer);

    const finalFilePath = 'productImage/' + `${filename}`;
    res = finalFilePath;
    return NextResponse.json(
      { done: "ok", filename: filename, httpfilepath: finalFilePath },
      { status: 201 }
    );
  } catch (e) {
    console.error("Error while trying to upload a file\n", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
