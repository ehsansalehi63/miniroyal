/**
 * Self-hosted catalog artwork imported from the store inventory archive.
 * Keeping media local makes the storefront independent from VPN/CDN access.
 */
export const REAL_IMAGES = {
  heroWinter: "/images/catalog/catalog-26.png",
  heroParty: "/images/catalog/catalog-27.png",
  heroBaby: "/images/catalog/catalog-28.png",
  boyHoodie: "/images/catalog/catalog-01.png",
  girlDress: "/images/catalog/catalog-06.png",
  babySet: "/images/catalog/catalog-08.png",
  jacket: "/images/catalog/catalog-05.png",
  editorial: "/images/catalog/catalog-17.png",
  heroSlide1: "/images/catalog/catalog-29.png",
} as const;

/**
 * Each demo product has its own editorial photo URL. These are kept in one
 * place so a later admin upload can replace them without touching product
 * data. The query string is intentionally unique per SKU to avoid browser
 * cache collisions while the catalog is being migrated to self-hosted media.
 */
export const PRODUCT_REAL_IMAGES = {
  boyHoodie: "/images/catalog/catalog-01.png",
  girlDress: "/images/catalog/catalog-06.png",
  babySuit: "/images/catalog/catalog-08.png",
  boyJacket: "/images/catalog/catalog-05.png",
} as const;

export const CATEGORY_REAL_IMAGES = [
  ...Array.from({ length: 28 }, (_, index) =>
    `/images/catalog/catalog-${String(index + 2).padStart(2, "0")}.png`
  ),
] as const;

export const PRODUCT_FALLBACKS = {
  girl: REAL_IMAGES.girlDress,
  baby: REAL_IMAGES.babySet,
  outerwear: REAL_IMAGES.jacket,
  boy: REAL_IMAGES.boyHoodie,
} as const;
