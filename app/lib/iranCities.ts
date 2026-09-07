// اطلاعات جامع ۳۱ استان و شهرهای ایران به همراه فرمول دقیق استعلام آنلاین تیپاکس (Tipax)

export type ProvinceWithCities = {
  name: string;
  cities: string[];
};

export const IRAN_PROVINCES: ProvinceWithCities[] = [
  {
    name: "تهران",
    cities: ["تهران", "اسلامشهر", "شهریار", "قدس", "ملارد", "ورامین", "پاکدشت", "ری", "دماوند", "فیروزکوه", "رباط‌کریم", "بهارستان", "پردیس", "قرچک", "لواسان", "بومهن", "چهاردانگه", "پیشوا"],
  },
  {
    name: "اصفهان",
    cities: ["اصفهان", "کاشان", "نجف‌آباد", "خمینی‌شهر", "شاهین‌شهر", "لنجان", "فولادشهر", "شهرضا", "مبارکه", "آران و بیدگل", "فلاورجان", "زرین‌شهر", "تیران", "گلپایگان", "نطنز", "سمیرم", "نایین", "خوانسار", "اردستان", "فریدن", "فریدون‌شهر", "دهاقان"],
  },
  {
    name: "البرز",
    cities: ["کرج", "فردیس", "ساوجبلاغ", "نظرآباد", "هشتگرد", "طالقان", "اشتهارد", "کمال‌شهر", "محمدشهر", "ماهدشت", "چهارباغ"],
  },
  {
    name: "فارس",
    cities: ["شیراز", "مرودشت", "کازرون", "جهرم", "لارستان", "فسا", "داراب", "فیروزآباد", "آباده", "ممسنی", "اقلید", "سپیدان", "لامرد", "استهبان", "نی‌ریز", "گراش"],
  },
  {
    name: "خراسان رضوی",
    cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "چناران", "تایباد", "سرخس", "گناباد", "تربت جام", "فریمان", "خواف", "بردسکن", "طرقبه", "شاندیز"],
  },
  {
    name: "آذربایجان شرقی",
    cities: ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "جلفا", "هادی‌شهر", "آذرشهر", "شبستر", "عجب‌شیر", "اسکو", "هشترود", "ملکان", "کلیبر"],
  },
  {
    name: "آذربایجان غربی",
    cities: ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "نقده", "پیرانشهر", "ماکو", "سردشت", "شاهین‌دژ", "تکاب", "اشنویه", "شوط", "پلدشت"],
  },
  {
    name: "خوزستان",
    cities: ["اهواز", "دزفول", "آبادان", "خرمشهر", "ماهشهر", "بهبهان", "ایذه", "شوشتر", "رامهرمز", "مسجدسلیمان", "اندیمشک", "شوش", "امیدیه", "سوسنگرد", "شادگان", "هندیجان", "باغملک"],
  },
  {
    name: "مازندران",
    cities: ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "نکا", "بابلسر", "تنکابن", "نوشهر", "رامسر", "محمودآباد", "نور", "جویبار", "فریدونکنار", "کلاردشت"],
  },
  {
    name: "گیلان",
    cities: ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "رودسر", "صومعه‌سرا", "آستارا", "فومن", "رودبار", "آستانه اشرفیه", "رضوانشهر", "ماسال", "سیاهکل", "املش"],
  },
  {
    name: "قم",
    cities: ["قم", "قنوات", "جعفریه", "کهک", "دستجرد", "سلفچگان"],
  },
  {
    name: "مرکزی",
    cities: ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند", "زرندیه", "تفرش", "آشتیان", "فراهان", "کمیجان"],
  },
  {
    name: "قزوین",
    cities: ["قزوین", "تاکستان", "الوند", "اقبالیه", "آبیک", "بوئین‌زهرا", "محمدیه", "محمودآباد نمونه", "اسفرورین"],
  },
  {
    name: "همدان",
    cities: ["همدان", "ملایر", "نهاوند", "تویسرکان", "بهار", "کبودرآهنگ", "رزن", "اسدآباد", "فامنین"],
  },
  {
    name: "یزد",
    cities: ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه", "تفت", "اشکذر", "هرات", "مروست"],
  },
  {
    name: "کرمان",
    cities: ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "کهنوج", "شهربابک", "بافت", "بردسیر", "عنبرآباد", "راور", "منوجان"],
  },
  {
    name: "کرمانشاه",
    cities: ["کرمانشاه", "اسلام‌آباد غرب", "کنگاور", "سنقر", "هرسین", "صحنه", "جوانرود", "پاوه", "سرپل ذهاب", "روانسر", "گیلانغرب"],
  },
  {
    name: "کردستان",
    cities: ["سنندج", "سقز", "مریوان", "بانه", "قروه", "بیجار", "کامیاران", "دهگلان", "دیواندره", "سروآباد"],
  },
  {
    name: "لرستان",
    cities: ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "نورآباد", "پلدختر", "الشتر", "ازنا", "چگنی"],
  },
  {
    name: "سمنان",
    cities: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر", "ایوانکی", "سرخه", "بسطام", "آرادان"],
  },
  {
    name: "زنجان",
    cities: ["زنجان", "ابهر", "خرمدره", "قیدار", "هیدج", "صائین‌قلعه", "آب‌بر", "زرین‌آباد"],
  },
  {
    name: "گلستان",
    cities: ["گرگان", "گنبد کاووس", "علی‌آباد کتول", "بندر ترکمن", "آق‌قلا", "کلاله", "آزادشهر", "کردکوی", "مینودشت", "گالیکش", "بندر گز"],
  },
  {
    name: "اردبیل",
    cities: ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "بیله‌سوار", "سرعین", "نمین", "کوثر", "اصلاندوز"],
  },
  {
    name: "بوشهر",
    cities: ["بوشهر", "برازجان", "کنگان", "گناوه", "خورموج", "جم", "عسلویه", "دیلم", "دیر", "اهرم"],
  },
  {
    name: "هرمزگان",
    cities: ["بندرعباس", "میناب", "قشم", "کیش", "بندرلنگه", "رودان", "حاجی‌آباد", "بستک", "جاسک", "پارسیان", "خمیر"],
  },
  {
    name: "سیستان و بلوچستان",
    cities: ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان", "خاش", "نیک‌شهر", "کنارک", "زهک", "راسک", "میرجاوه"],
  },
  {
    name: "چهارمحال و بختیاری",
    cities: ["شهرکرد", "بروجن", "فارسان", "لردگان", "فرخشهر", "سامان", "بن", "کیار", "اردل", "کوهرنگ"],
  },
  {
    name: "کهگیلویه و بویراحمد",
    cities: ["یاسوج", "دوگنبدان", "دهدشت", "سی‌سخت", "چرام", "لنده", "لیکک"],
  },
  {
    name: "ایلام",
    cities: ["ایلام", "دهلران", "ایوان", "آبدانان", "دره‌شهر", "مهران", "سرابله", "ملکشاهی"],
  },
  {
    name: "خراسان شمالی",
    cities: ["بجنورد", "شیروان", "اسفراین", "جاجرم", "گرمه", "فاروج", "مانه و سملقان", "راز و جرگلان"],
  },
  {
    name: "خراسان جنوبی",
    cities: ["بیرجند", "قائنات", "طبس", "فردوس", "نهبندان", "سرایان", "بشرویه", "درمیان", "سربیشه"],
  },
];

// لیست همه استان‌ها
export const PROVINCE_NAMES = IRAN_PROVINCES.map((p) => p.name);

// نرمال‌سازی حروف فارسی
export function normalizePersian(str: string): string {
  return (str || "")
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/^استان\s+/, "")
    .replace(/^شهرستان\s+/, "")
    .replace(/^شهر\s+/, "")
    .trim();
}

// یافتن استان از روی متن یا مختصات
export function findProvince(input: string): string | null {
  const norm = normalizePersian(input);
  if (!norm) return null;
  const match = IRAN_PROVINCES.find((p) => normalizePersian(p.name) === norm || norm.includes(normalizePersian(p.name)));
  return match ? match.name : null;
}

// یافتن شهر از روی متن
export function findCity(cityName: string, provinceName?: string): string | null {
  const normCity = normalizePersian(cityName);
  if (!normCity) return null;

  if (provinceName) {
    const prov = IRAN_PROVINCES.find((p) => normalizePersian(p.name) === normalizePersian(provinceName));
    if (prov) {
      const cityMatch = prov.cities.find((c) => normalizePersian(c) === normCity || normCity.includes(normalizePersian(c)));
      if (cityMatch) return cityMatch;
    }
  }

  for (const prov of IRAN_PROVINCES) {
    const cityMatch = prov.cities.find((c) => normalizePersian(c) === normCity || normCity.includes(normalizePersian(c)));
    if (cityMatch) return cityMatch;
  }

  return normCity;
}

// شهرهای تابعه یک استان
export function getCitiesOfProvince(provinceName: string): string[] {
  const norm = normalizePersian(provinceName);
  const found = IRAN_PROVINCES.find((p) => normalizePersian(p.name) === norm);
  return found ? found.cities : [];
}

/**
 * ماتریس منطقه‌ای و مسافتی تیپاکس (Tipax Distance & Tariff Zones)
 * مبدأ پیش‌فرض: اصفهان (Isfahan)
 */
const ORIGIN_PROVINCE = "اصفهان";
const ORIGIN_CITY = "اصفهان";

const NEIGHBOR_PROVINCES = ["تهران", "البرز", "قم", "مرکزی", "چهارمحال و بختیاری", "لرستان", "فارس", "یزد", "سمنان"];
const REMOTE_PROVINCES = [
  "سیستان و بلوچستان",
  "هرمزگان",
  "بوشهر",
  "آذربایجان غربی",
  "آذربایجان شرقی",
  "اردبیل",
  "ایلام",
  "خراسان جنوبی",
  "خراسان شمالی",
];

export type TipaxRateResult = {
  costToman: number;
  breakdown: {
    baseRate: number;
    weightSurcharge: number;
    insurance: number;
    taxAndHandling: number;
    zoneName: string;
  };
  estimatedDelivery: string;
};

/**
 * محاسبه آنلاین هزینه ارسال تیپاکس بر اساس آدرس (استان و شهر مقصد)، وزن و ارزش سفارش
 */
export function calculateTipaxRate({
  province,
  city,
  weightGrams = 500,
  valueToman = 0,
}: {
  province: string;
  city: string;
  weightGrams?: number;
  valueToman?: number;
}): TipaxRateResult {
  const normProv = normalizePersian(province);
  const normCity = normalizePersian(city);

  let baseRate = 88000;
  let weightPerKgRate = 12000;
  let zoneName = "استان همجوار";
  let estimatedDelivery = "۱ الی ۲ روز کاری";

  // ۱. درون‌شهری (اصفهان به اصفهان)
  if (normProv === ORIGIN_PROVINCE && normCity === ORIGIN_CITY) {
    baseRate = 65000;
    weightPerKgRate = 8000;
    zoneName = "درون‌شهری (تحویل فوری)";
    estimatedDelivery = "همان روز یا حداکثر ۲۴ ساعت";
  }
  // ۲. درون‌استانی (شهرهای دیگر استان اصفهان مثل کاشان، نجف‌آباد، شاهین‌شهر)
  else if (normProv === ORIGIN_PROVINCE) {
    baseRate = 76000;
    weightPerKgRate = 9000;
    zoneName = "درون‌استانی (هم‌استانی)";
    estimatedDelivery = "۲۴ ساعته";
  }
  // ۳. استان‌های همجوار
  else if (NEIGHBOR_PROVINCES.some((np) => normProv.includes(np))) {
    baseRate = 88000;
    weightPerKgRate = 12000;
    zoneName = "استان همجوار";
    estimatedDelivery = "۱ الی ۲ روز کاری";
  }
  // ۴. استان‌های دوردست و مرزی
  else if (REMOTE_PROVINCES.some((rp) => normProv.includes(rp))) {
    baseRate = 118000;
    weightPerKgRate = 18000;
    zoneName = "استان دوردست / مرزی";
    estimatedDelivery = "۲ الی ۳ روز کاری";
  }
  // ۵. سایر استان‌ها (غیرهمجوار استاندارد مثل گیلان، مازندران، خراسان رضوی، خوزستان و...)
  else {
    baseRate = 102000;
    weightPerKgRate = 15000;
    zoneName = "استان غیرهمجوار";
    estimatedDelivery = "۱ الی ۲ روز کاری";
  }

  // اضافه وزن (پایه تا ۱ کیلوگرم است)
  const weightKg = Math.max(0.1, weightGrams / 1000);
  const extraKg = Math.max(0, Math.ceil(weightKg - 1));
  const weightSurcharge = extraKg * weightPerKgRate;

  // حق بیمه تیپاکس بر اساس ارزش سفارش (حداقل ۳,۰۰۰ تومان تا حداکثر ۲۵,۰۰۰ تومان)
  const rawInsurance = Math.round(valueToman * 0.002);
  const insurance = Math.max(3000, Math.min(rawInsurance, 25000));

  // مالیات ارزش افزوده و خدمات بسته‌بندی امن تیپاکس
  const subtotalCost = baseRate + weightSurcharge + insurance;
  const taxAndHandling = Math.round(subtotalCost * 0.1);

  // جمع کل و رند کردن به هزار تومان
  const totalRaw = subtotalCost + taxAndHandling;
  const costToman = Math.round(totalRaw / 1000) * 1000;

  return {
    costToman,
    breakdown: {
      baseRate,
      weightSurcharge,
      insurance,
      taxAndHandling,
      zoneName,
    },
    estimatedDelivery,
  };
}
