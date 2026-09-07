import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { mediaFilePath, legacyMediaFilePaths } from "@/app/lib/media-storage";

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
  const candidates = [mediaFilePath(filename), ...legacyMediaFilePaths(filename)].filter(Boolean) as string[];
  for (const filePath of candidates) {
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
      // try the next candidate location
    }
  }
  return new NextResponse("Not Found", { status: 404 });
}
