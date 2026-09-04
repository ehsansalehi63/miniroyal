import { NextRequest, NextResponse } from "next/server";
import { verifyAdminOtp } from "@/app/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const verified = await verifyAdminOtp(typeof body.phone === "string" ? body.phone : "", typeof body.code === "string" ? body.code : "");
    return NextResponse.json({ success: verified, error: verified ? undefined : "کد ورود نادرست یا منقضی شده است." }, { status: verified ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: "تأیید کد ورود مدیر انجام نشد." }, { status: 400 });
  }
}
