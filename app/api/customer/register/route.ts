import { NextRequest, NextResponse } from "next/server";
import { registerCustomer } from "@/app/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (fullName.length < 2 || phone.length < 10 || password.length < 8) {
      return NextResponse.json({ success: false, error: "نام، شماره موبایل و رمز عبور حداقل ۸ کاراکتری لازم است." }, { status: 400 });
    }
    const customer = await registerCustomer({ fullName, phone, email, password });
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Duplicate") ? "این شماره موبایل یا ایمیل قبلاً ثبت شده است." : "ثبت‌نام انجام نشد.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
