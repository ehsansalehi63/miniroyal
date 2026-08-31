export type Gender = "boy" | "girl" | "unisex";

export interface Category {
  id: number;
  parentId: number | null;
  parentSlug?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  productCount?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface Variant {
  id: number;
  productId: number;
  sku: string;
  size: string; // e.g., "2-3 سال" or "90"
  color: string; // e.g., "قرمز"
  colorCode?: string; // e.g., "#EF4444"
  stock: number;
  priceAdjustment: number;
}

export interface ProductMedia {
  id: number;
  productId: number;
  url: string;
  alt?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface SizeChartRow {
  size: string;
  ageRange: string;
  heightCm: string;
  chestCm: string;
  lengthCm: string;
  sleeveCm?: string;
  waistCm?: string;
  hipCm?: string;
  shoulderCm?: string;
  garmentChestCm?: string;
  garmentLengthCm?: string;
  easeCm?: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  authorName: string;
  rating: number; // 1-5
  comment: string;
  sizeFit: "small" | "perfect" | "large";
  isVerifiedBuyer: boolean;
  createdAt: string;
  adminReply?: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  sku: string;
  shortDesc: string;
  description: string;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  brandName?: string;
  gender: Gender;
  ageMinMonth: number;
  ageMaxMonth: number;
  basePrice: number; // Toman
  salePrice?: number; // Toman
  isFeatured: boolean;
  isSpecialOffer: boolean;
  salesCount: number;
  viewsCount: number;
  ratingAvg: number;
  ratingCount: number;
  status: "active" | "draft" | "review" | "archived";
  fitType: "tight" | "normal" | "loose";
  seoTitle?: string;
  seoDesc?: string;
  faqJson?: ProductFAQ[];
  sizeChartJson?: SizeChartRow[];
  images: string[];
  variants: Variant[];
  reviews?: ProductReview[];
  publishedAt: string;
  features?: string[];
  fabricMaterial?: string;
  washCare?: string;
  fitProfile?: {
    garmentType: "top" | "bottom" | "dress" | "outerwear" | "set" | "baby";
    measurementMethod: "body" | "garment";
    preferredBodyMeasurement: "height" | "chest" | "waist" | "hip";
    easeCm: number;
    stretch: "none" | "low" | "medium" | "high";
    sizeSystem: "age" | "height" | "letter" | "custom";
    tryOnAnchors: { shoulder: number; waist: number; length: number };
  };
  tryOnAsset?: {
    url: string;
    layerType: "top" | "bottom" | "full" | "accessory";
    anchorPoints?: {
      shoulder: number;
      waist: number;
      length: number;
    };
  };
}

export interface CatalogFilterParams {
  categorySlug?: string;
  gender?: Gender | "all";
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  isSpecialOffer?: boolean;
  search?: string;
  sort?: "recommended" | "newest" | "price_asc" | "price_desc" | "bestselling" | "popular";
  page?: number;
  limit?: number;
}
