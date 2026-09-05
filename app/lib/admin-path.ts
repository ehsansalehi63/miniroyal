/**
 * مسیر عمومی پنل مدیریت.
 *
 * middleware اجازه می‌دهد پنل روی یک مسیر دلخواه (ADMIN_PANEL_PATH) سرو شود و آن را
 * داخلی به `/admin` بازنویسی می‌کند. در سمت مرورگر همان مسیر دلخواه در URL دیده می‌شود،
 * بنابراین لینک‌های داخل پنل باید بر اساس مسیر جاری ساخته شوند وگرنه به ۴۰۴ می‌خورند
 * (پیشخوان دو لینک ثابت `/ehsanpaneladmin/...` داشت که در نبود آن متغیر محیطی ۴۰۴ می‌داد).
 */
export const DEFAULT_ADMIN_BASE = "/admin";

/** مسیر پایهٔ پنل از روی URL جاری مرورگر. */
export function adminBaseFromPathname(pathname: string | null | undefined) {
  const first = (pathname || "").split("/").filter(Boolean)[0];
  return first ? `/${first}` : DEFAULT_ADMIN_BASE;
}

/**
 * برای تشخیص «صفحهٔ پنل بودن» در چیدمان ریشه. اگر پنل روی مسیر دلخواه سرو می‌شود،
 * همان مقدار را در NEXT_PUBLIC_ADMIN_PANEL_PATH هم قرار دهید تا هدر/فوتر فروشگاه
 * روی صفحه‌های پنل رندر نشود.
 */
const publicCustomBase = (process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH || "").trim().replace(/^\/+|\/+$/g, "");

export function isAdminPathname(pathname: string | null | undefined) {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  if (path === DEFAULT_ADMIN_BASE || path.startsWith(`${DEFAULT_ADMIN_BASE}/`)) return true;
  if (!publicCustomBase) return false;
  const custom = `/${publicCustomBase}`;
  return path === custom || path.startsWith(`${custom}/`);
}
