"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";

export type ProductAttributeDraft = {
  definitionId?: number | null;
  fieldKey: string;
  label: string;
  value: string | number | boolean | string[];
  unit?: string | null;
  isCustom?: boolean;
  sortOrder?: number;
};

type Definition = { id: number; fieldKey: string; label: string; helpText?: string; inputType: string; unit?: string; options?: string[]; isRequired?: boolean; sortOrder?: number };
type Suggestion = { fieldKey: string; displayValue: string };

interface Props { categoryId: number; categoryName?: string; categorySlug?: string; value: ProductAttributeDraft[]; onChange: (value: ProductAttributeDraft[]) => void; }

export default function ProductSpecificationsEditor({ categoryId, categoryName = "", categorySlug = "", value, onChange }: Props) {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fallbackDefinitions = useMemo<Definition[]>(() => {
    const key = `${categoryName} ${categorySlug}`.toLowerCase();
    const make = (fieldKey: string, label: string, helpText: string, inputType = "text", unit?: string, options?: string[]): Definition => ({ id: 0, fieldKey, label, helpText, inputType, unit, options, isRequired: false, sortOrder: 0 });
    if (/اکسسوری|کلاه|عینک|زیور|جوراب|کیف|کفش|پیشبند|دستکش|aksessori|kolah|eynak|zivar|jorab|kif|kafsh/.test(key)) return [make("material", "جنس و متریال", "پارچه، چرم، فلز یا جنس اصلی محصول"), make("color", "رنگ‌بندی", "رنگ‌های موجود محصول", "text", undefined, ["سفید", "مشکی", "صورتی", "آبی", "طلایی"]), make("size", "سایز یا اندازه", "برای کفش شماره پا، برای کلاه دور سر و برای اکسسوری اندازه کلی"), make("season", "فصل استفاده", "فصل یا موقعیت مناسب استفاده", "select", undefined, ["چهارفصل", "بهار و تابستان", "پاییز و زمستان", "مجلسی"]), make("care", "روش نگهداری", "شست‌وشو یا مراقبت از محصول", "textarea")];
    if (/شلوار|دامن|شلوارک|shalvar|daman/.test(key)) return [make("material", "جنس پارچه", "مثال: کتان، جین، نخ پنبه"), make("fit", "فرم لباس", "برش و حالت ایستایی لباس", "select", undefined, ["راسته", "اسلیم", "مام‌فیت", "گشاد", "کمرکش"]), make("waistType", "نوع کمر", "کمرکش، دکمه‌ای یا کش و بند", "select", undefined, ["کمرکش", "دکمه‌ای", "کش و بند", "زیپ‌دار"]), make("pockets", "جیب", "تعداد یا نوع جیب"), make("season", "فصل استفاده", "فصل مناسب استفاده", "select", undefined, ["چهارفصل", "بهار و تابستان", "پاییز و زمستان"]), make("care", "روش نگهداری", "دستور شست‌وشو", "textarea")];
    if (/کاپشن|پالتو|هودی|سویشرت|jacket|hoodie|kapshan/.test(key)) return [make("material", "جنس و لایه لباس", "مثال: دورس، پافر، مموری یا پشم"), make("warmth", "میزان گرما", "مناسب چه دمایی یا فصلی است؟", "select", undefined, ["سبک", "متوسط", "گرم"]), make("fit", "فرم لباس", "راسته، آزاد یا جذب", "select", undefined, ["راسته", "آزاد", "اسلیم"]), make("closure", "نوع بسته‌شدن", "زیپ، دکمه یا بدون بست", "select", undefined, ["زیپ", "دکمه", "زیپ و دکمه", "بدون بست"]), make("care", "روش نگهداری", "دستور شست‌وشو", "textarea")];
    if (/پیراهن|سارافون|dress|pirahan/.test(key)) return [make("material", "جنس پارچه", "مثال: نخ، لینن، مخمل یا تور"), make("fit", "فرم پیراهن", "راسته، فون، چین‌دار یا آزاد", "select", undefined, ["راسته", "فون", "چین‌دار", "آزاد"]), make("sleeve", "آستین", "نوع و قد آستین"), make("occasion", "مناسبت", "روزمره، مجلسی یا مهمانی", "select", undefined, ["روزمره", "مجلسی", "مهمانی"]), make("care", "روش نگهداری", "دستور شست‌وشو", "textarea")];
    return [make("material", "جنس پارچه", "مثال: نخ پنبه، دورس یا لینن"), make("fit", "فرم لباس", "راسته، آزاد یا جذب", "select", undefined, ["راسته", "آزاد", "اسلیم"]), make("sleeve", "آستین", "نوع آستین یا بدون آستین"), make("season", "فصل استفاده", "فصل مناسب استفاده", "select", undefined, ["چهارفصل", "بهار و تابستان", "پاییز و زمستان"]), make("care", "روش نگهداری", "دستور شست‌وشو", "textarea")];
  }, [categoryName, categorySlug]);

  useEffect(() => {
    if (!categoryId) { setDefinitions([]); setSuggestions([]); return; }
    setLoading(true);
    fetch(`/api/admin/attribute-definitions?categoryId=${categoryId}`, { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "دریافت مشخصات دسته‌بندی انجام نشد."); setDefinitions(data.definitions?.length ? data.definitions : fallbackDefinitions); setSuggestions(data.suggestions || []); })
      .catch(() => { setDefinitions(fallbackDefinitions); setSuggestions([]); })
      .finally(() => setLoading(false));
  }, [categoryId, fallbackDefinitions]);

  useEffect(() => {
    if (!definitions.length || value.length) return;
    onChange(definitions.map((definition) => ({ definitionId: definition.id, fieldKey: definition.fieldKey, label: definition.label, value: definition.inputType === "multiselect" ? [] : "", unit: definition.unit, isCustom: false, sortOrder: definition.sortOrder })));
  }, [definitions, value.length, onChange]);

  const definitionsByKey = useMemo(() => new Map(definitions.map((definition) => [definition.fieldKey, definition])), [definitions]);
  const setAttribute = (index: number, patch: Partial<ProductAttributeDraft>) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const removeAttribute = (index: number) => { if (definitionsByKey.get(value[index]?.fieldKey || "")?.isRequired) return; onChange(value.filter((_, itemIndex) => itemIndex !== index)); };
  const addCustom = () => onChange([...value, { fieldKey: `custom-${Date.now()}`, label: "مشخصهٔ سفارشی", value: "", isCustom: true, sortOrder: value.length }]);

  return <section dir="rtl" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h4 className="text-xs font-black text-amber-950">مشخصات اختصاصی محصول</h4><p className="mt-1 text-[10px] leading-5 text-amber-900">ابتدا دسته‌بندی را انتخاب کنید؛ فیلدهای مرتبط همراه با توضیح نمایش داده می‌شوند. فیلدهای غیرضروری را می‌توانید حذف یا مشخصهٔ جدید اضافه کنید.</p></div>
      <button type="button" onClick={addCustom} className="flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-2 text-[10px] font-bold text-white"><Plus className="size-3" /> افزودن مشخصه دلخواه</button>
    </div>
    {!categoryId && <p className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-[11px] font-bold text-amber-800">برای دیدن مشخصات، ابتدا دسته‌بندی محصول را انتخاب کنید.</p>}
    {categoryId && loading && <p className="mt-4 text-[11px] text-amber-800">در حال دریافت مشخصات مرتبط...</p>}
    <div className="mt-3 space-y-3">{value.map((item, index) => { const definition = definitionsByKey.get(item.fieldKey); const options = definition?.options || []; const listId = `suggestions-${item.fieldKey}`; return <div key={`${item.fieldKey}-${index}`} className="rounded-xl border border-amber-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2"><div className="flex-1"><div className="flex items-center gap-1"><label className="text-[11px] font-black text-stone-800">{item.isCustom ? <input value={item.label} onChange={(event) => setAttribute(index, { label: event.target.value })} className="rounded border border-stone-200 px-1 py-0.5 text-[11px] font-black" /> : item.label}</label>{definition?.isRequired && <span className="text-rose-600">*</span>} {definition?.helpText && <span title={definition.helpText}><HelpCircle className="size-3 text-amber-700" /></span>}</div>{definition?.helpText && <p className="mt-1 text-[10px] leading-5 text-stone-500">{definition.helpText}</p>}</div><button type="button" disabled={Boolean(definition?.isRequired)} onClick={() => removeAttribute(index)} title={definition?.isRequired ? "این مشخصه الزامی است" : "حذف مشخصه"} className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="size-4" /></button></div>
      {definition?.inputType === "textarea" ? <textarea value={String(item.value || "")} onChange={(event) => setAttribute(index, { value: event.target.value })} className="mt-2 min-h-16 w-full rounded-lg border border-amber-200 p-2 text-xs outline-none focus:border-amber-500" placeholder={definition.helpText || "مقدار را وارد کنید"} /> : definition?.inputType === "select" ? <select value={String(item.value || "")} onChange={(event) => setAttribute(index, { value: event.target.value })} className="mt-2 w-full rounded-lg border border-amber-200 bg-white p-2 text-xs outline-none focus:border-amber-500"><option value="">انتخاب کنید</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : definition?.inputType === "multiselect" ? <input list={listId} value={Array.isArray(item.value) ? item.value.join(", ") : String(item.value || "")} onChange={(event) => setAttribute(index, { value: event.target.value.split(",").map((part) => part.trim()).filter(Boolean) })} className="mt-2 w-full rounded-lg border border-amber-200 p-2 text-xs outline-none focus:border-amber-500" placeholder="مقادیر را با ویرگول جدا کنید" /> : <div className="mt-2 flex items-center gap-2"><input list={listId} type={definition?.inputType === "number" ? "number" : "text"} value={String(item.value ?? "")} onChange={(event) => setAttribute(index, { value: event.target.value })} className="w-full rounded-lg border border-amber-200 p-2 text-xs outline-none focus:border-amber-500" placeholder={definition?.helpText || "مقدار را وارد کنید"} /><span className="text-[10px] text-stone-500">{item.unit || definition?.unit || ""}</span></div>}
      <datalist id={listId}>{suggestions.filter((suggestion) => suggestion.fieldKey === item.fieldKey).map((suggestion) => <option key={suggestion.displayValue} value={suggestion.displayValue} />)}</datalist>
    </div>; })}</div>
  </section>;
}
