import { Category } from "./types/catalog";
import { CATEGORY_REAL_IMAGES_SMALL, THUMB_IMAGES } from "./imageCatalog";

/**
 * A practical child/teen fashion taxonomy based on the department structure
 * shoppers are familiar with on large Iranian marketplaces.
 */
export const kidsCategories: Category[] = [
  ["لباس نوزادی", "lebas-nozadi", "nozad", "🍼", THUMB_IMAGES.babySet],
  ["سرهمی نوزاد", "sarhami-nozad", "nozad", "🧸", THUMB_IMAGES.babySet],
  ["بادی و لباس زیر نوزاد", "bodi-nozad", "nozad", "🤍", THUMB_IMAGES.babySet],
  ["ست بیمارستانی و سیسمونی", "set-bimarestani", "nozad", "🧺", THUMB_IMAGES.babySet],
  ["کلاه، پیشبند و دستکش نوزاد", "kolah-pishband-nozad", "nozad", "🧢", THUMB_IMAGES.babySet],
  ["لباس دخترانه", "lebas-dokhtaraneh", "dokhtaraneh", "🎀", THUMB_IMAGES.girlDress],
  ["پیراهن و سارافون دخترانه", "pirahan-dokhtaraneh", "dokhtaraneh", "👗", THUMB_IMAGES.girlDress],
  ["بلوز و شومیز دخترانه", "bluz-dokhtaraneh", "dokhtaraneh", "🌸", THUMB_IMAGES.girlDress],
  ["دامن و شلوار دخترانه", "daman-shalvar-dokhtaraneh", "dokhtaraneh", "🩰", THUMB_IMAGES.girlDress],
  ["لباس مجلسی دخترانه", "majlesi-dokhtaraneh", "dokhtaraneh", "✨", THUMB_IMAGES.girlDress],
  ["لباس پسرانه", "lebas-pesaraneh", "pesaraneh", "🧢", THUMB_IMAGES.boyHoodie],
  ["تیشرت و پولوشرت پسرانه", "tshirt-pesaraneh", "pesaraneh", "👕", THUMB_IMAGES.boyHoodie],
  ["پیراهن پسرانه", "pirahan-pesaraneh", "pesaraneh", "🧥", THUMB_IMAGES.boyHoodie],
  ["شلوار و شلوارک پسرانه", "shalvar-pesaraneh", "pesaraneh", "👖", THUMB_IMAGES.boyHoodie],
  ["هودی، سویشرت و ژاکت کودک", "hoodie-sweatshirt", "pesaraneh", "🧶", THUMB_IMAGES.jacket],
  ["کاپشن و پالتو کودک", "kapshan-palto-koodak", "madreseh", "🧣", THUMB_IMAGES.jacket],
  ["لباس فرم و مدرسه", "lebas-madreseh", "madreseh", "🎒", THUMB_IMAGES.jacket],
  ["لباس ورزشی کودک و نوجوان", "lebas-varzeshi", "set", "⚽", THUMB_IMAGES.editorial],
  ["ست لباس کودک و نوجوان", "set-lebas-koodak", "set", "🧩", THUMB_IMAGES.editorial],
  ["لباس نوجوان دخترانه", "lebas-nojavanan-dokhtar", "dokhtaraneh", "💜", THUMB_IMAGES.girlDress],
  ["لباس نوجوان پسرانه", "lebas-nojavanan-pesar", "pesaraneh", "💙", THUMB_IMAGES.boyHoodie],
  ["کفش و کتانی کودک", "kafsh-koodak", "set", "👟", THUMB_IMAGES.editorial],
  ["جوراب و پاپوش کودک", "jorab-papush", "nozad", "🧦", THUMB_IMAGES.babySet],
  ["کیف و کوله‌پشتی کودک", "kif-koodak", "madreseh", "🎒", THUMB_IMAGES.jacket],
  ["کلاه و اکسسوری مو", "kolah-aksessori-mo", "set", "🎀", THUMB_IMAGES.girlDress],
  ["عینک آفتابی کودک", "eynak-aftabi-koodak", "set", "🕶️", THUMB_IMAGES.editorial],
  ["زیورآلات و اکسسوری فانتزی", "zivar-aksessori-fantasy", "set", "⭐", THUMB_IMAGES.editorial],
  ["اکسسوری نوزاد", "aksessori-nozad", "nozad", "🧸", THUMB_IMAGES.babySet],
].map(([name, slug, parentSlug, icon], index) => ({
  id: 100 + index,
  parentId: null,
  parentSlug,
  name,
  slug,
  icon,
  // نکته: پیش‌تر [index + 1] بود که برای آخرین دسته از محدودهٔ آرایه بیرون می‌زد
  // و imageUrl آن undefined می‌شد؛ حالا با پیمانه همیشه تصویر معتبر می‌گیرد.
  imageUrl: CATEGORY_REAL_IMAGES_SMALL[index % CATEGORY_REAL_IMAGES_SMALL.length],
  description: `انتخابی از ${name} برای کودک و نوجوان`,
  sortOrder: 10 + index,
  productCount: 0,
})) as Category[];
