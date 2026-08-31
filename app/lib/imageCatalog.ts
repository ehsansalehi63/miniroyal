/**
 * Real editorial photography used by the storefront.
 * Product owners can replace any product image from the admin panel.
 */
export const REAL_IMAGES = {
  heroWinter:
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1600&q=88",
  heroParty:
    "https://images.unsplash.com/photo-1503919545889-aef636e3d3d5?auto=format&fit=crop&w=1600&q=88",
  heroBaby:
    "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1600&q=88",
  boyHoodie:
    "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=1000&q=88",
  girlDress:
    "https://images.unsplash.com/photo-1503919545889-aef636e3d3d5?auto=format&fit=crop&w=1000&q=88",
  babySet:
    "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1000&q=88",
  jacket:
    "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1000&q=88",
  editorial:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=88",
} as const;

export const PRODUCT_FALLBACKS = {
  girl: REAL_IMAGES.girlDress,
  baby: REAL_IMAGES.babySet,
  outerwear: REAL_IMAGES.jacket,
  boy: REAL_IMAGES.boyHoodie,
} as const;
