import { NextResponse } from "next/server";
import { getHomeSlides } from "@/app/lib/settings";

export async function GET() {
  try {
    const slides = await getHomeSlides();
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    return NextResponse.json({ success: false, slides: [] }, { status: 500 });
  }
}
