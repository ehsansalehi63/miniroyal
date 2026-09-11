import { NextRequest, NextResponse } from "next/server";

function configuredAdminPath() {
  const value = process.env.ADMIN_PANEL_PATH?.trim().replace(/^\/+|\/+$/g, "");
  return value && !value.includes("/") ? `/${value}` : null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, "") || "/";

  // تاییدیه خودکار فایل HTML گوگل سرچ کنسول (مانند google12345.html)
  const googleMatch = pathname.match(/^\/google([a-zA-Z0-9_-]+)\.html$/);
  if (googleMatch) {
    const token = googleMatch[1];
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = "/api/google-verify";
    rewritten.searchParams.set("token", token);
    return NextResponse.rewrite(rewritten);
  }

  const adminPath = configuredAdminPath();
  if (!adminPath) return NextResponse.next();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (pathname === adminPath || pathname.startsWith(`${adminPath}/`)) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = `/admin${pathname.slice(adminPath.length) || ""}`;
    return NextResponse.rewrite(rewritten);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
