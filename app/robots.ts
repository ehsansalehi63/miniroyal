import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://miniroyal.shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // مسیرهای بدون ارزش ایندکس و بخش‌های خصوصی و اداری
        disallow: [
          "/admin",
          "/admin/",
          "/ehsanpaneladmin",
          "/ehsanpaneladmin/",
          "/api/",
          "/checkout",
          "/payment/",
          "/cart",
          "/account",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/images/", "/fonts/", "/uploads/"],
        disallow: ["/admin/", "/ehsanpaneladmin/", "/api/", "/checkout", "/payment/", "/cart", "/account"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/images/", "/uploads/"],
        disallow: ["/admin/", "/ehsanpaneladmin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
