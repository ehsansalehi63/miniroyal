import { NextRequest, NextResponse } from "next/server";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildStudioSvgDataUri(prompt: string) {
  const rawTitle = prompt.length > 25 ? `${prompt.substring(0, 25)}...` : prompt;
  const titleText = escapeXml(rawTitle);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="50%" stop-color="#312e81"/>
            <stop offset="100%" stop-color="#4338ca"/>
          </linearGradient>
        </defs>
        <rect width="800" height="1000" rx="32" fill="url(#bg)"/>
        <circle cx="400" cy="500" r="350" fill="#ffffff" opacity="0.1"/>
        <g transform="translate(400, 420) scale(1.6)">
          <path d="M -100 -120 Q 0 -100 100 -120 L 120 150 Q 0 165 -120 150 Z" fill="#f59e0b"/>
          <path d="M -70 -120 Q 0 -80 70 -120" fill="none" stroke="#ffffff" stroke-width="6"/>
          <circle cx="0" cy="10" r="28" fill="#ffffff"/>
        </g>
        <text x="400" y="820" fill="#ffffff" font-family="Vazirmatn, sans-serif" font-size="32" font-weight="900" text-anchor="middle">${titleText}</text>
        <text x="400" y="870" fill="#fbbf24" font-family="Vazirmatn, sans-serif" font-size="22" font-weight="700" text-anchor="middle">تولید شده با هوش مصنوعی مینی رویال 👑</text>
      </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: unknown = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "لطفاً توضیحات یا نام محصول را وارد کنید." },
        { status: 400 }
      );
    }

    const enhancedPrompt = prompt.trim();

    // Fetch the generated image server-side and inline it as a data URI so the
    // browser never has to reach an external host (blocked on some Iranian ISPs).
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt + ", high quality studio product photography of kids clothing, 8k, photorealistic"
    )}?width=800&height=1000&seed=${seed}&nologo=true`;

    let finalImageUrl = buildStudioSvgDataUri(enhancedPrompt);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType?.includes("image")) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        finalImageUrl = `data:${contentType};base64,${base64}`;
      }
    } catch (err) {
      console.warn("AI image provider unavailable, using local studio fallback:", err);
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      enhancedPrompt: `${enhancedPrompt}, studio photography, 8k resolution`,
      seed,
    });
  } catch (err) {
    console.error("Error in AI image route:", err);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در پردازش تصویر هوش مصنوعی.",
        imageUrl: "/images/products/boy-hoodie.svg",
      },
      { status: 500 }
    );
  }
}
