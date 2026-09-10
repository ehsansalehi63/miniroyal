import { NextRequest, NextResponse } from "next/server";
import { getProductApprovedReviews, submitCustomerReview } from "@/app/lib/reviews";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = Number(searchParams.get("productId"));
  if (!productId) {
    return NextResponse.json({ success: false, error: "شناسه محصول معتبر نیست." }, { status: 400 });
  }

  const reviews = await getProductApprovedReviews(productId);
  return NextResponse.json({ success: true, reviews });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = Number(body.productId);
    const authorName = typeof body.authorName === "string" ? body.authorName : "";
    const comment = typeof body.comment === "string" ? body.comment : "";
    const rating = Number(body.rating || 5);
    const sizeFit = body.sizeFit === "small" || body.sizeFit === "large" ? body.sizeFit : "perfect";

    if (!productId || !comment.trim()) {
      return NextResponse.json(
        { success: false, error: "متن دیدگاه و شناسه محصول الزامی است." },
        { status: 400 }
      );
    }

    const id = await submitCustomerReview({
      productId,
      authorName: authorName.trim() || "خریدار مینی‌رویال",
      rating,
      comment: comment.trim(),
      sizeFit,
    });

    return NextResponse.json({
      success: true,
      message: "دیدگاه شما با موفقیت ثبت شد و پس از بررسی منتشر خواهد شد. متشکریم! 🌸",
      id,
    });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      { success: false, error: "ثبت دیدگاه انجام نشد." },
      { status: 500 }
    );
  }
}
