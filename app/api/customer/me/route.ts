import { NextResponse } from "next/server";
import { currentCustomer } from "@/app/lib/customer-auth";

export async function GET() {
  try {
    const customer = await currentCustomer();
    return NextResponse.json({ success: true, customer });
  } catch {
    return NextResponse.json({ success: false, customer: null }, { status: 503 });
  }
}
