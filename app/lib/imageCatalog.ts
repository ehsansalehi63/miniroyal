/**
 * Fully self-hosted storefront artwork (SVG illustrations).
 * Zero external CDNs — the site loads identically with or without a VPN,
 * on slow Iranian mobile networks, and offline during deploys.
 * Product owners can still replace any product image from the admin panel.
 */
export const REAL_IMAGES = {
  heroWinter: "/images/models/hero-boy.svg",
  heroParty: "/images/models/hero-girl.svg",
  heroBaby: "/images/models/hero-baby.svg",
  boyHoodie: "/images/products/boy-hoodie.svg",
  girlDress: "/images/products/girl-dress.svg",
  babySet: "/images/products/baby-suit.svg",
  jacket: "/images/products/boy-jacket.svg",
  editorial: "/images/products/blog-1.svg",
  heroSlide1: "/images/products/hero-slide1.svg",
} as const;

export const PRODUCT_FALLBACKS = {
  girl: REAL_IMAGES.girlDress,
  baby: REAL_IMAGES.babySet,
  outerwear: REAL_IMAGES.jacket,
  boy: REAL_IMAGES.boyHoodie,
} as const;
