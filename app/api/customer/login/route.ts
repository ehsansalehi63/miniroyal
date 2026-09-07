import { NextRequest, NextResponse } from "next/server";
import { loginCustomer } from "@/app/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const password = typeof body.password === "string" ? body.password : "";
    const customer = await loginCustomer(phone, password);
    if (!customer) return NextResponse.json({ success: false, error: "شماره موبایل یا رمز عبور صحیح نیست." }, { status: 401 });
    return NextResponse.json({ success: true, customer });
  } catch {
    return NextResponse.json({ success: false, error: "ورود انجام نشد." }, { status: 400 });
  }
}
