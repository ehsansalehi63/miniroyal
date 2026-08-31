import { mockCategories, mockProducts } from "./data/mockProducts";
import { CatalogFilterParams, Category, Product } from "./types/catalog";
import { kidsCategories } from "./kidsCategories";

export async function getCategories(): Promise<Category[]> {
  // If MySQL is configured, query categories table here
  return [...mockCategories, ...kidsCategories];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cat = [...mockCategories, ...kidsCategories].find((c) => c.slug === slug);
  return cat || null;
}

export async function getProducts(params: CatalogFilterParams = {}): Promise<{
  products: Product[];
  total: number;
  categories: Category[];
  availableSizes: string[];
  availableColors: { name: string; hex: string }[];
}> {
  let list = [...mockProducts];

  // Category filter
  if (params.categorySlug && params.categorySlug !== "all") {
    list = list.filter(
      (p) =>
        p.categorySlug === params.categorySlug ||
        ([...mockCategories, ...kidsCategories].find((c) => c.slug === params.categorySlug)?.parentSlug === p.categorySlug) ||
        params.categorySlug === "shop"
    );
  }

  // Gender filter
  if (params.gender && params.gender !== "all") {
    list = list.filter((p) => p.gender === params.gender || p.gender === "unisex");
  }

  // Size filter
  if (params.sizes && params.sizes.length > 0) {
    list = list.filter((p) =>
      p.variants.some((v) => params.sizes?.includes(v.size))
    );
  }

  // Color filter
  if (params.colors && params.colors.length > 0) {
    list = list.filter((p) =>
      p.variants.some((v) => params.colors?.includes(v.color))
    );
  }

  // Price range
  if (params.minPrice !== undefined) {
    list = list.filter((p) => (p.salePrice ?? p.basePrice) >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    list = list.filter((p) => (p.salePrice ?? p.basePrice) <= params.maxPrice!);
  }

  // Special offer
  if (params.isSpecialOffer) {
    list = list.filter((p) => p.isSpecialOffer);
  }

  // Search filter
  if (params.search && params.search.trim() !== "") {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.features?.some((f) => f.toLowerCase().includes(q))
    );
  }

  // Sorting
  const sort = params.sort || "recommended";
  if (sort === "newest") {
    list.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } else if (sort === "price_asc") {
    list.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
  } else if (sort === "price_desc") {
    list.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
  } else if (sort === "bestselling") {
    list.sort((a, b) => b.salesCount - a.salesCount);
  } else if (sort === "popular") {
    list.sort((a, b) => b.viewsCount - a.viewsCount);
  } else {
    // recommended: featured first then highest rated
    list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.ratingAvg - a.ratingAvg);
  }

  // Compute available facets
  const sizesSet = new Set<string>();
  const colorsMap = new Map<string, string>();

  mockProducts.forEach((p) => {
    p.variants.forEach((v) => {
      sizesSet.add(v.size);
      if (v.color && v.colorCode) {
        colorsMap.set(v.color, v.colorCode);
      }
    });
  });

  const availableSizes = Array.from(sizesSet);
  const availableColors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
    name,
    hex,
  }));

  return {
    products: list,
    total: list.length,
    categories: [...mockCategories, ...kidsCategories],
    availableSizes,
    availableColors,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = mockProducts.find((item) => item.slug === slug);
  return p || null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return mockProducts.filter((p) => p.isFeatured).slice(0, limit);
}

export async function getSpecialOfferProducts(limit = 8): Promise<Product[]> {
  return mockProducts.filter((p) => p.isSpecialOffer).slice(0, limit);
}

export async function getLatestProducts(limit = 8): Promise<Product[]> {
  return [...mockProducts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export async function getBestSellerProducts(limit = 8): Promise<Product[]> {
  return [...mockProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, limit);
}

export async function getRelatedProducts(productId: number, categoryId: number, limit = 4): Promise<Product[]> {
  return mockProducts
    .filter((p) => p.id !== productId && p.categoryId === categoryId)
    .slice(0, limit);
}

export async function searchAutocomplete(query: string): Promise<{
  products: { id: number; title: string; slug: string; image: string; price: number }[];
  categories: { name: string; slug: string }[];
}> {
  if (!query || query.trim().length === 0) {
    return { products: [], categories: [] };
  }

  const q = query.trim().toLowerCase();

  const matchingProducts = mockProducts
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: p.images[0],
      price: p.salePrice ?? p.basePrice,
    }));

  const matchingCategories = mockCategories
    .concat(kidsCategories)
    .filter((c) => c.name.toLowerCase().includes(q))
    .map((c) => ({ name: c.name, slug: c.slug }));

  return {
    products: matchingProducts,
    categories: matchingCategories,
  };
}
