import { extname, join } from "path";
import { stat, mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.]/g, "_");
}

export async function POST(request: NextRequest) {
  // await validateJWT(request)
  // console.log(request.text())
  const formData = await request.formData();

  const file = formData.get("image") as any | null;
  if (!file) {
    return NextResponse.json(
      { error: "File blob is required." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const PATH: string| undefined = process.env.NEXT_PUBLIC_IMAGES_PATH;
  if(!PATH) {
    throw new Error('NEXT_PUBLIC_IMAGES_PATH is not defined in the environment variables');
  }
  

  const pathDist: string = join(process.cwd(), "public/", PATH);
  //   const relativeUploadDir = `${dateFn.format(Date.now(), "dd-MM-Y")}`;
  //   const uploadDir = join(pathDist, relativeUploadDir);

  console.log("Path", pathDist);

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
    const fileExtension = extname(file?.name);
    const originalFilename = file?.name.replace(/\.[^/.]+$/, "");
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const fileExtName = `${sanitizedFilename}_${uniqueSuffix}${fileExtension}`;
    // console.log("filename : " + fileExtName);
    await writeFile(`${pathDist}/${fileExtName}`, buffer);

    const finalFilePath = "productImage/" + `${fileExtName}`;
    // res = finalFilePath;
    return NextResponse.json(
      { done: "ok", filename: fileExtName, httpfilepath: finalFilePath },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Error while trying to upload a file\n", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
