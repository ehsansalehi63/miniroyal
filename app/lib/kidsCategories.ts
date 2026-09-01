import { Category } from "./types/catalog";
import { CATEGORY_REAL_IMAGES, REAL_IMAGES } from "./imageCatalog";

/**
 * A practical child/teen fashion taxonomy based on the department structure
 * shoppers are familiar with on large Iranian marketplaces.
 */
export const kidsCategories: Category[] = [
  ["لباس نوزادی", "lebas-nozadi", "nozad", "🍼", REAL_IMAGES.babySet],
  ["سرهمی نوزاد", "sarhami-nozad", "nozad", "🧸", REAL_IMAGES.babySet],
  ["بادی و لباس زیر نوزاد", "bodi-nozad", "nozad", "🤍", REAL_IMAGES.babySet],
  ["ست بیمارستانی و سیسمونی", "set-bimarestani", "nozad", "🧺", REAL_IMAGES.babySet],
  ["کلاه، پیشبند و دستکش نوزاد", "kolah-pishband-nozad", "nozad", "🧢", REAL_IMAGES.babySet],
  ["لباس دخترانه", "lebas-dokhtaraneh", "dokhtaraneh", "🎀", REAL_IMAGES.girlDress],
  ["پیراهن و سارافون دخترانه", "pirahan-dokhtaraneh", "dokhtaraneh", "👗", REAL_IMAGES.girlDress],
  ["بلوز و شومیز دخترانه", "bluz-dokhtaraneh", "dokhtaraneh", "🌸", REAL_IMAGES.girlDress],
  ["دامن و شلوار دخترانه", "daman-shalvar-dokhtaraneh", "dokhtaraneh", "🩰", REAL_IMAGES.girlDress],
  ["لباس مجلسی دخترانه", "majlesi-dokhtaraneh", "dokhtaraneh", "✨", REAL_IMAGES.girlDress],
  ["لباس پسرانه", "lebas-pesaraneh", "pesaraneh", "🧢", REAL_IMAGES.boyHoodie],
  ["تیشرت و پولوشرت پسرانه", "tshirt-pesaraneh", "pesaraneh", "👕", REAL_IMAGES.boyHoodie],
  ["پیراهن پسرانه", "pirahan-pesaraneh", "pesaraneh", "🧥", REAL_IMAGES.boyHoodie],
  ["شلوار و شلوارک پسرانه", "shalvar-pesaraneh", "pesaraneh", "👖", REAL_IMAGES.boyHoodie],
  ["هودی، سویشرت و ژاکت کودک", "hoodie-sweatshirt", "pesaraneh", "🧶", REAL_IMAGES.jacket],
  ["کاپشن و پالتو کودک", "kapshan-palto-koodak", "madreseh", "🧣", REAL_IMAGES.jacket],
  ["لباس فرم و مدرسه", "lebas-madreseh", "madreseh", "🎒", REAL_IMAGES.jacket],
  ["لباس ورزشی کودک و نوجوان", "lebas-varzeshi", "set", "⚽", REAL_IMAGES.editorial],
  ["ست لباس کودک و نوجوان", "set-lebas-koodak", "set", "🧩", REAL_IMAGES.editorial],
  ["لباس نوجوان دخترانه", "lebas-nojavanan-dokhtar", "dokhtaraneh", "💜", REAL_IMAGES.girlDress],
  ["لباس نوجوان پسرانه", "lebas-nojavanan-pesar", "pesaraneh", "💙", REAL_IMAGES.boyHoodie],
  ["کفش و کتانی کودک", "kafsh-koodak", "set", "👟", REAL_IMAGES.editorial],
  ["جوراب و پاپوش کودک", "jorab-papush", "nozad", "🧦", REAL_IMAGES.babySet],
  ["کیف و کوله‌پشتی کودک", "kif-koodak", "madreseh", "🎒", REAL_IMAGES.jacket],
  ["کلاه و اکسسوری مو", "kolah-aksessori-mo", "set", "🎀", REAL_IMAGES.girlDress],
  ["عینک آفتابی کودک", "eynak-aftabi-koodak", "set", "🕶️", REAL_IMAGES.editorial],
  ["زیورآلات و اکسسوری فانتزی", "zivar-aksessori-fantasy", "set", "⭐", REAL_IMAGES.editorial],
  ["اکسسوری نوزاد", "aksessori-nozad", "nozad", "🧸", REAL_IMAGES.babySet],
].map(([name, slug, parentSlug, icon], index) => ({
  id: 100 + index,
  parentId: null,
  parentSlug,
  name,
  slug,
  icon,
  imageUrl: CATEGORY_REAL_IMAGES[index + 1],
  description: `انتخابی از ${name} برای کودک و نوجوان`,
  sortOrder: 10 + index,
  productCount: 0,
})) as Category[];
