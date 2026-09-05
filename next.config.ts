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
        // Admin sessions and API responses are user-specific. Hostinger's
        // front proxy must never cache an anonymous response and replay it
        // after a successful admin login.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        // ADMIN_PANEL_PATH is rewritten to /admin by middleware, but the
        // public custom path must also be protected before that rewrite.
        source: "/ehsanpaneladmin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        source: "/ehsanpaneladmin",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
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
