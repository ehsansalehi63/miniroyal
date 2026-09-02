import { NextResponse } from "next/server";
import { clearSession } from "@/app/lib/customer-auth";

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
