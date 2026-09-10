import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, "");

  const html = `google-site-verification: google${safeToken}.html`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
