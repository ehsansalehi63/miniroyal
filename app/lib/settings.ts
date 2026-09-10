import type { RowDataPacket } from "mysql2";
import pool from "./mysql";
import { DEFAULT_HOME_SLIDES, HomeSlide } from "./homeConfig";

export interface StoreSettings {
  siteName: string;
  tagline: string;
  phone: string;
  mobile: string;
  address: string;
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
  freeShippingThreshold: number;
  baseShippingFee: number;
  activeGateway: string;
  zarinpalMerchant: string;
  isSandbox: boolean;
  smsProvider: string;
  smsSenderLine: string;
  smsPatternCode: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  siteName: "مینی رویال",
  tagline: "فروشگاه تخصصی پوشاک کودک و نوجوان",
  phone: "۰۲۱-۸۸۸۸۹۹۹۹",
  mobile: "۰۹۱۲۳۴۵۶۷۸۹",
  address: "تهران، خیابان ولیعصر، مجتمع تجاری رویال، پلاک ۴۲",
  announcementText: "👑 ارسال رایگان خریدهای بالای ۵۰۰ هزار تومان | 👗 پرو آنلاین لباس با تضمین سایز",
  heroTitle: "شیک‌ترین لباس‌های فصل برای فرشته‌های کوچک شما 👑",
  heroSubtitle: "کالکشن جدید پاییزه و زمستانه با پارچه‌های ۱۰۰٪ پنبه ارگانیک ضد حساسیت",
  freeShippingThreshold: 500000,
  baseShippingFee: 45000,
  activeGateway: "zarinpal",
  zarinpalMerchant: "00000000-0000-0000-0000-000000000000",
  isSandbox: true,
  smsProvider: "iranpayamak",
  smsSenderLine: "10008888",
  smsPatternCode: "100100",
};

export async function ensureSettingsTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS store_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT setting_key, setting_value FROM store_settings"
    );
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.setting_key] = r.setting_value;
    }

    return {
      siteName: map.siteName || DEFAULT_SETTINGS.siteName,
      tagline: map.tagline || DEFAULT_SETTINGS.tagline,
      phone: map.phone || DEFAULT_SETTINGS.phone,
      mobile: map.mobile || DEFAULT_SETTINGS.mobile,
      address: map.address || DEFAULT_SETTINGS.address,
      announcementText: map.announcementText || DEFAULT_SETTINGS.announcementText,
      heroTitle: map.heroTitle || DEFAULT_SETTINGS.heroTitle,
      heroSubtitle: map.heroSubtitle || DEFAULT_SETTINGS.heroSubtitle,
      freeShippingThreshold: map.freeShippingThreshold ? Number(map.freeShippingThreshold) : DEFAULT_SETTINGS.freeShippingThreshold,
      baseShippingFee: map.baseShippingFee ? Number(map.baseShippingFee) : DEFAULT_SETTINGS.baseShippingFee,
      activeGateway: map.activeGateway || DEFAULT_SETTINGS.activeGateway,
      zarinpalMerchant: map.zarinpalMerchant || DEFAULT_SETTINGS.zarinpalMerchant,
      isSandbox: map.isSandbox !== undefined ? map.isSandbox === "true" : DEFAULT_SETTINGS.isSandbox,
      smsProvider: map.smsProvider || DEFAULT_SETTINGS.smsProvider,
      smsSenderLine: map.smsSenderLine || DEFAULT_SETTINGS.smsSenderLine,
      smsPatternCode: map.smsPatternCode || DEFAULT_SETTINGS.smsPatternCode,
    };
  } catch (err) {
    console.warn("getStoreSettings fallback:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoreSettings(settings: Partial<StoreSettings>) {
  await ensureSettingsTable();
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      const valStr = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
      await pool.execute(
        `INSERT INTO store_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
        [key, valStr]
      );
    }
  }
}

export async function getHomeSlides(): Promise<HomeSlide[]> {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT setting_value FROM store_settings WHERE setting_key = 'home_slides' LIMIT 1"
    );
    if (rows.length > 0 && rows[0].setting_value) {
      const parsed = JSON.parse(rows[0].setting_value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_HOME_SLIDES;
}

export async function saveHomeSlides(slides: HomeSlide[]) {
  await ensureSettingsTable();
  await pool.execute(
    `INSERT INTO store_settings (setting_key, setting_value)
     VALUES ('home_slides', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(slides)]
  );
}
