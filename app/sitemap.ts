import type { MetadataRoute } from "next";
import { getProducts } from "./lib/catalog";
import { kidsCategories } from "./lib/kidsCategories";
import { blogPosts } from "./lib/blogPosts";

const SITE_URL = process.env.SITE_URL || "https://miniroyal.shop";

// کاتالوگ از دیتابیس می‌آید؛ هر ساعت یک‌بار نقشهٔ سایت تازه شود.
export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/virtual-tryon", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/order/track", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/returns", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
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
  for (const category of kidsCategories) {
    const slug = category.parentSlug || category.slug;
    if (seen.has(slug)) continue;
    seen.add(slug);
    entries.push({
      url: `${SITE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const post of blogPosts) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  try {
    const { products } = await getProducts({});
    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // اگر دیتابیس در دسترس نبود، نقشهٔ سایت بدون محصولات منتشر می‌شود.
  }

  return entries;
}
