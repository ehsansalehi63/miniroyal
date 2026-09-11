import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "./lib/catalog";
import { kidsCategories } from "./lib/kidsCategories";
import { blogPosts } from "./lib/blogPosts";

const SITE_URL = process.env.SITE_URL || "https://miniroyal.shop";

// نقشهٔ سایت به صورت خودکار با تغییر کاتالوگ یا بازه کش بروزرسانی می‌شود
export const revalidate = 1800; // ۳۰ دقیقه

const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/shop", priority: 0.95, changeFrequency: "daily" as const },
  { path: "/virtual-tryon", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/blog", priority: 0.75, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/order/track", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/returns", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const seen = new Set<string>();

  // ۱. دسته‌بندی‌های استاتیک کودکان
  for (const category of kidsCategories) {
    if (!seen.has(category.slug)) {
      seen.add(category.slug);
      entries.push({
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    if (category.parentSlug && !seen.has(category.parentSlug)) {
      seen.add(category.parentSlug);
      entries.push({
        url: `${SITE_URL}/category/${category.parentSlug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  // ۲. دسته‌بندی‌های داینامیک ثبت‌شده در دیتابیس
  try {
    const dbCategories = await getCategories();
    for (const cat of dbCategories) {
      if (cat.slug && !seen.has(cat.slug)) {
        seen.add(cat.slug);
        entries.push({
          url: `${SITE_URL}/category/${cat.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }
  } catch (err) {
    console.warn("Dynamic categories sitemap error:", err);
  }

  // ۳. مقالات مجله و راهنمای استایل کودک
  for (const post of blogPosts) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // ۴. کلیه محصولات فعال کاتالوگ با تصاویر کامل
  try {
    const { products } = await getProducts({});
    for (const product of products) {
      const productImages = (product.images || [])
        .filter(Boolean)
        .map((img) => (img.startsWith("http") ? img : `${SITE_URL}${img.startsWith("/") ? "" : "/"}${img}`));

      entries.push({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: product.publishedAt ? new Date(product.publishedAt) : now,
        changeFrequency: "daily",
        priority: 0.9,
        ...(productImages.length > 0 ? { images: productImages } : {}),
      });
    }
  } catch (err) {
    console.warn("Product catalog sitemap error:", err);
  }

  return entries;
}
