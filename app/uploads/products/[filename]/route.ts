import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { mediaFilePath } from "@/app/lib/media-storage";

type Context = { params: Promise<{ filename: string }> };

function contentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".gif") return "image/gif";
  if (extension === ".avif") return "image/avif";
  return "image/webp";
}

export async function GET(_request: Request, context: Context) {
  const { filename } = await context.params;
  const filePath = mediaFilePath(filename);
  if (!filePath) return new NextResponse("Not Found", { status: 404 });
  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
