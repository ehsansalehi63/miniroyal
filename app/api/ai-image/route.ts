import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, category = "پسرانه" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "لطفاً توضیحات یا نام محصول را وارد کنید." },
        { status: 400 }
      );
    }

    // Enhance Persian/Short prompt into high quality studio photography prompt
    let enhancedPrompt = prompt.trim();
    
    // Simple translation/enrichment dictionary for common Persian terms
    const termMap: Record<string, string> = {
      "هودی": "kids winter hoodie sweatshirt",
      "کاپشن": "kids winter puffer jacket coat",
      "پیراهن": "girl elegant floral dress",
      "سرهمی": "baby organic cotton onesie suit",
      "شلوار": "kids denim pants trousers",
      "تیشرت": "stylish kids summer t-shirt",
      "مدرسه": "school uniform outfit",
      "مجلسی": "luxury party dress kids",
      "پسرانه": "for boy, studio fashion photography",
      "دخترانه": "for girl, studio fashion photography",
      "نوزاد": "for baby, cute studio setup",
    };

    let englishKeywords = [];
    for (const [key, val] of Object.entries(termMap)) {
      if (enhancedPrompt.includes(key)) {
        englishKeywords.push(val);
      }
    }

    const basePrompt = englishKeywords.length > 0 
      ? englishKeywords.join(", ") 
      : `${enhancedPrompt}, kids clothing fashion studio product photography`;

    const fullPrompt = `${basePrompt}, clean studio background, studio lighting, highly detailed, photorealistic, 8k resolution, professional fashion catalog`;
    const seed = Math.floor(Math.random() * 1000000);

    // Pollinations AI URL (Free, open AI image generation API with zero API key required)
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1000&seed=${seed}&nologo=true&model=flux`;

    return NextResponse.json({
      success: true,
      imageUrl,
      enhancedPrompt: fullPrompt,
      seed,
    });
  } catch (err: any) {
    console.error("Error in AI image route:", err);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در برقراری ارتباط با سرویس هوش مصنوعی.",
        imageUrl: "/images/products/boy-hoodie.svg",
      },
      { status: 500 }
    );
  }
}
