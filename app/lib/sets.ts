import { Product } from "./types/catalog";

export interface SuggestedSet {
  id: string;
  title: string;
  description: string;
  products: Product[];
  score: number;
  reason: string;
}

export function getSuggestedSets(products: Product[], limit = 4): SuggestedSet[] {
  const active = products.filter((product) =>
    product.status === "active" && product.variants.some((variant) => variant.stock > 0)
  );
  const result: SuggestedSet[] = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const first = active[i];
      const second = active[j];
      const sameAudience = first.gender === second.gender || first.gender === "unisex" || second.gender === "unisex";
      const ageOverlap = Math.max(first.ageMinMonth, second.ageMinMonth) <= Math.min(first.ageMaxMonth, second.ageMaxMonth);
      const score = (sameAudience ? 40 : 15) + (ageOverlap ? 35 : 0) + Math.min(25, Math.round((first.salesCount + second.salesCount) / 20));
      result.push({
        id: `${first.id}-${second.id}`,
        title: `ست پیشنهادی ${first.categoryName} و ${second.categoryName}`,
        description: "ترکیب خودکار بر اساس گروه سنی، مخاطب و محبوبیت محصولات",
        products: [first, second],
        score,
        reason: sameAudience && ageOverlap ? "هماهنگی مخاطب و بازهٔ سنی" : "ترکیب محبوب بر اساس فروش و بازدید",
      });
    }
  }
  return result.sort((a, b) => b.score - a.score).slice(0, limit);
}
