import type { RowDataPacket } from "mysql2";
import pool from "./mysql";
import { CatalogFilterParams, Category, Product, Variant } from "./types/catalog";

type CategoryRow = RowDataPacket & {
  id: number; parent_id: number | null; name: string; slug: string; description: string | null;
  icon: string | null; image_url: string | null; sort_order: number;
};
type ProductRow = RowDataPacket & {
  id: number; title: string; slug: string; sku: string; short_desc: string | null; description: string | null;
  category_id: number; category_slug: string; category_name: string; brand_name: string | null;
  gender: Product["gender"]; age_min_month: number; age_max_month: number; base_price: number; sale_price: number | null;
  is_featured: number; is_special_offer: number; sales_count: number; views_count: number; rating_avg: number; rating_count: number;
  status: Product["status"]; fit_type: Product["fitType"]; seo_title: string | null; seo_desc: string | null;
  faq_json: unknown; size_chart_json: unknown; published_at: Date | string;
};
type VariantRow = RowDataPacket & { id: number; product_id: number; sku: string; size: string; color: string; color_code: string | null; stock: number; price_adjustment: number };
type MediaRow = RowDataPacket & { id: number; product_id: number; url: string; alt: string | null; sort_order: number; is_primary: number };

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

async function loadCategories() {
  const [rows] = await pool.execute<CategoryRow[]>("SELECT id, parent_id, name, slug, description, icon, image_url, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order, id");
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows.map((row): Category => ({
    id: row.id, parentId: row.parent_id, parentSlug: row.parent_id ? byId.get(row.parent_id)?.slug : undefined,
    name: row.name, slug: row.slug, description: row.description || undefined, icon: row.icon || undefined,
    imageUrl: row.image_url || undefined, sortOrder: row.sort_order,
  }));
}

async function loadProducts(where = "p.status = 'active'", params: (string | number)[] = []) {
  const [productRows] = await pool.execute<ProductRow[]>(
    `SELECT p.id, p.title, p.slug, p.sku, p.short_desc, p.description, p.category_id,
      c.slug AS category_slug, c.name AS category_name, b.name AS brand_name, p.gender,
      p.age_min_month, p.age_max_month, p.base_price, p.sale_price, p.is_featured,
      p.is_special_offer, p.sales_count, p.views_count, p.rating_avg, p.rating_count,
      p.status, p.fit_type, p.seo_title, p.seo_desc, p.faq_json, p.size_chart_json, p.published_at
     FROM products p JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE ${where} ORDER BY p.id`, params
  );
  if (!productRows.length) return [] as Product[];
  const ids = productRows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const [variantRows] = await pool.execute<VariantRow[]>(`SELECT id, product_id, sku, size, color, color_code, stock, price_adjustment FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY id`, ids);
  const [mediaRows] = await pool.execute<MediaRow[]>(`SELECT id, product_id, url, alt, sort_order, is_primary FROM product_media WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`, ids);
  const variantsByProduct = new Map<number, Variant[]>();
  for (const row of variantRows) {
    const variants = variantsByProduct.get(row.product_id) || [];
    variants.push({ id: row.id, productId: row.product_id, sku: row.sku, size: row.size, color: row.color, colorCode: row.color_code || undefined, stock: Number(row.stock), priceAdjustment: Number(row.price_adjustment) });
    variantsByProduct.set(row.product_id, variants);
  }
  const mediaByProduct = new Map<number, MediaRow[]>();
  for (const row of mediaRows) mediaByProduct.set(row.product_id, [...(mediaByProduct.get(row.product_id) || []), row]);
  return productRows.map((row): Product => ({
    id: row.id, title: row.title, slug: row.slug, sku: row.sku, shortDesc: row.short_desc || "", description: row.description || "",
    categoryId: row.category_id, categorySlug: row.category_slug, categoryName: row.category_name, brandName: row.brand_name || undefined,
    gender: row.gender, ageMinMonth: row.age_min_month, ageMaxMonth: row.age_max_month, basePrice: Number(row.base_price), salePrice: row.sale_price === null ? undefined : Number(row.sale_price),
    isFeatured: Boolean(row.is_featured), isSpecialOffer: Boolean(row.is_special_offer), salesCount: Number(row.sales_count), viewsCount: Number(row.views_count), ratingAvg: Number(row.rating_avg), ratingCount: Number(row.rating_count),
    status: row.status, fitType: row.fit_type, seoTitle: row.seo_title || undefined, seoDesc: row.seo_desc || undefined,
    faqJson: parseJson(row.faq_json, []), sizeChartJson: parseJson(row.size_chart_json, []), images: (mediaByProduct.get(row.id) || []).map((media) => media.url),
    variants: variantsByProduct.get(row.id) || [], publishedAt: new Date(row.published_at).toISOString(),
  }));
}

export async function getCategories(): Promise<Category[]> { return loadCategories(); }

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await loadCategories();
  return categories.find((category) => category.slug === slug) || null;
}

export async function getProducts(params: CatalogFilterParams = {}) {
  const categories = await loadCategories();
  let list = await loadProducts();
  const category = params.categorySlug && params.categorySlug !== "all" ? categories.find((item) => item.slug === params.categorySlug) : null;
  if (params.categorySlug && params.categorySlug !== "all" && params.categorySlug !== "shop") {
    const allowed = new Set([params.categorySlug, ...(category ? categories.filter((item) => item.parentId === category.id).map((item) => item.slug) : [])]);
    list = list.filter((product) => allowed.has(product.categorySlug));
  }
  if (params.gender && params.gender !== "all") list = list.filter((product) => product.gender === params.gender || product.gender === "unisex");
  if (params.sizes?.length) list = list.filter((product) => product.variants.some((variant) => params.sizes?.includes(variant.size)));
  if (params.colors?.length) list = list.filter((product) => product.variants.some((variant) => params.colors?.includes(variant.color)));
  if (params.minPrice !== undefined) list = list.filter((product) => (product.salePrice ?? product.basePrice) >= params.minPrice!);
  if (params.maxPrice !== undefined) list = list.filter((product) => (product.salePrice ?? product.basePrice) <= params.maxPrice!);
  if (params.isSpecialOffer) list = list.filter((product) => product.isSpecialOffer);
  if (params.search?.trim()) {
    const query = params.search.trim().toLowerCase();
    list = list.filter((product) => [product.title, product.shortDesc, product.categoryName, ...(product.features || [])].some((value) => value.toLowerCase().includes(query)));
  }
  const sort = params.sort || "recommended";
  if (sort === "newest") list.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  else if (sort === "price_asc") list.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
  else if (sort === "price_desc") list.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
  else if (sort === "bestselling") list.sort((a, b) => b.salesCount - a.salesCount);
  else if (sort === "popular") list.sort((a, b) => b.viewsCount - a.viewsCount);
  else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.ratingAvg - a.ratingAvg);
  const sizes = new Set<string>(); const colors = new Map<string, string>();
  list.forEach((product) => product.variants.forEach((variant) => { sizes.add(variant.size); if (variant.colorCode) colors.set(variant.color, variant.colorCode); }));
  const page = Math.max(1, params.page || 1); const limit = params.limit || list.length || 1; const total = list.length;
  list = list.slice((page - 1) * limit, page * limit);
  return { products: list, total, categories, availableSizes: [...sizes], availableColors: [...colors].map(([name, hex]) => ({ name, hex })) };
}

export async function getProductBySlug(slug: string) { return (await loadProducts("p.status = 'active' AND p.slug = ?", [slug]))[0] || null; }

export async function getProductById(id: number) { return (await loadProducts("p.status = 'active' AND p.id = ?", [id]))[0] || null; }

export async function getFeaturedProducts(limit = 8) { return (await getProducts({ sort: "recommended", limit })).products.filter((product) => product.isFeatured); }
export async function getSpecialOfferProducts(limit = 8) { return (await getProducts({ isSpecialOffer: true, limit })).products; }
export async function getLatestProducts(limit = 8) { return (await getProducts({ sort: "newest", limit })).products; }
export async function getBestSellerProducts(limit = 8) { return (await getProducts({ sort: "bestselling", limit })).products; }
export async function getRelatedProducts(productId: number, categoryId: number, limit = 4) { return (await getProducts({ limit: 1000 })).products.filter((product) => product.id !== productId && product.categoryId === categoryId).slice(0, limit); }

export async function searchAutocomplete(query: string) {
  if (!query.trim()) return { products: [], categories: [] };
  const data = await getProducts({ search: query, limit: 5 });
  return { products: data.products.map((product) => ({ id: product.id, title: product.title, slug: product.slug, image: product.images[0] || "", price: product.salePrice ?? product.basePrice })), categories: data.categories.filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase())).map((category) => ({ name: category.name, slug: category.slug })) };
}
