import { revalidatePath } from "next/cache";
import { invalidateCatalogCache } from "./catalog";

/**
 * پاکسازی سریع کش درون‌حافظه‌ای کاتالوگ و ابطال کش صفحات Next.js
 * این متد بلافاصله پس از هرگونه تغییر موجودی، ویرایش قیمت، افزودن یا حذف محصول فراخوانی می‌شود
 * تا تغییرات بلافاصله در تمامی صفحات سایت (صفحه اصلی، فروشگاه، دسته‌ها و کارت محصول) منعکس شوند.
 */
export function refreshProductCatalog(productSlug?: string) {
  // ۱. حذف فوری کش رم کاتالوگ
  invalidateCatalogCache();

  // ۲. ابطال کش صفحات در Next.js
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/search");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    if (productSlug) {
      revalidatePath(`/product/${productSlug}`);
    }
  } catch (err) {
    // در مواردی که خارج از رکوئست Next.js صدا زده شود بدون ارور رد شود
    console.warn("revalidatePath caught warning:", err);
  }
}
