"use client";

import { useState } from "react";
import { SizeChartRow } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";

interface SizeChartTableProps {
  sizeChart?: SizeChartRow[];
}

export default function SizeChartTable({ sizeChart }: SizeChartTableProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);

  if (!sizeChart || sizeChart.length === 0) return null;

  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50/70 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-stone-900">
          <span>📏</span>
          <span>جدول سایز (سانتی‌متر)</span>
        </h3>
        <button
          onClick={() => setIsOpenModal(true)}
          className="text-xs font-bold text-violet-700 hover:underline"
        >
          راهنمای اندازه‌گیری دقیق 📐
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-100 text-stone-700">
              <th className="p-2.5 font-bold">سایز</th>
              <th className="p-2.5 font-bold">بازه سنی</th>
              <th className="p-2.5 font-bold">قد کودک (cm)</th>
              <th className="p-2.5 font-bold">دور سینه (cm)</th>
              <th className="p-2.5 font-bold">قد لباس (cm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-stone-800">
            {sizeChart.map((row, idx) => (
              <tr key={idx} className="hover:bg-violet-50/50">
                <td className="p-2.5 font-bold text-violet-700">{row.size}</td>
                <td className="p-2.5">{row.ageRange}</td>
                <td className="p-2.5">{toPersianDigits(row.heightCm)}</td>
                <td className="p-2.5">{toPersianDigits(row.chestCm)}</td>
                <td className="p-2.5">{toPersianDigits(row.lengthCm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* مدال راهنمای اندازه‌گیری */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-black text-stone-900">
              📐 چگونه اندام کودک را دقیق اندازه‌گیری کنیم؟
            </h4>
            <ul className="mt-4 space-y-3 text-xs leading-6 text-stone-600">
              <li>
                <strong className="text-stone-900">۱. قد کودک:</strong> کودک را بدون کفش تکیه داده به دیوار بایستانید و از بالای سر تا کف پا سانت بزنید.
              </li>
              <li>
                <strong className="text-stone-900">۲. دور سینه:</strong> متر را از زیر بغل و برجسته‌ترین بخش سینه دور اندام بپیچید (خیلی سفت نکنید).
              </li>
              <li>
                <strong className="text-stone-900">۳. قد لباس:</strong> از گودی گردن یا سرشانه تا پایینی‌ترین بخش تیشرت یا پیراهن.
              </li>
            </ul>
            <button
              onClick={() => setIsOpenModal(false)}
              className="mt-6 w-full rounded-2xl bg-violet-700 py-3 text-sm font-bold text-white shadow-md hover:bg-violet-800"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
