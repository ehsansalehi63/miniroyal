import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://miniroyal.shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // مسیرهای بدون ارزش ایندکس و بخش‌های خصوصی
        disallow: ["/admin", "/api/", "/checkout", "/payment", "/cart", "/account"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
