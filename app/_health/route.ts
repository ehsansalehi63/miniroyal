import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ready: true,
    timestamp: new Date().toISOString(),
  });
}
