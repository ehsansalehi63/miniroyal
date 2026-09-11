import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let token = request.nextUrl.searchParams.get("token") || "";

  if (!token) {
    const rawUrl = request.url || "";
    const match = rawUrl.match(/google([a-zA-Z0-9_-]+)\.html/i);
    if (match) token = match[1];
  }

  if (!token) {
    const invokePath = request.headers.get("x-invoke-path") || request.headers.get("x-matched-path") || "";
    const match = invokePath.match(/google([a-zA-Z0-9_-]+)\.html/i);
    if (match) token = match[1];
  }

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
