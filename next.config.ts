import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All artwork is self-hosted under /public — no external image CDNs,
    // so the storefront renders fully with or without VPN/DNS filtering.
    //
    // تصاویر از قبل با scripts/optimize-images.mjs به WebP بهینه شده‌اند و با
    // <img> معمولی سرو می‌شوند؛ بنابراین به بهینه‌ساز زمان اجرا نیازی نیست
    // (روی هاست اشتراکی بار CPU اضافه نمی‌کند).
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // دارایی‌های لوکال انگشت‌نامه‌دار نیستند، ولی محتوا به‌ندرت عوض می‌شود؛
        // با ETag و کش یک‌ماهه، بازدیدهای بعدی دیگر ۵۰ مگابایت تصویر دانلود نمی‌کنند.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/video/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
