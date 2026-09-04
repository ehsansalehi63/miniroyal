"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserCog } from "lucide-react";

type AdminUser = { id: number; username: string; full_name: string; phone: string | null; email: string; role: string; is_active: number; last_login: string | null };
const roleLabels: Record<string, string> = { super_admin: "مالک اصلی", admin: "مدیر", editor: "ویراستار محصولات", operator: "اپراتور" };

export default function AdminRolesPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<number | null>(null);

  const load = () => fetch("/api/admin/users", { cache: "no-store" }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت اعضا انجام نشد.");
    setUsers(data.users || []);
  }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "دریافت اعضا انجام نشد."));

  useEffect(() => { void load(); }, []);

  const save = async (user: AdminUser) => {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, role: user.role, isActive: Boolean(user.is_active) }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "ذخیره دسترسی انجام نشد."); return; }
    setSaved(user.id); window.setTimeout(() => setSaved(null), 1800);
  };

  return <div dir="rtl" className="space-y-6">
    <div><p className="fashion-kicker text-[10px] font-black">Access control</p><h1 className="mt-2 text-2xl font-black text-stone-900">مدیریت اعضا و دسترسی ادمین</h1><p className="mt-1 text-xs text-stone-500">مالک اصلی می‌تواند نقش هر عضو را برای محصولات، سفارش، انبار و گزارش‌ها تعیین کند.</p></div>
    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div>}
    <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-stone-100 bg-violet-50/50 p-5"><ShieldCheck className="size-5 text-violet-700" /><p className="text-xs font-bold text-violet-950">نقش‌ها با session سروری و OTP پیامکی محافظت می‌شوند.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-xs"><thead className="bg-stone-50 text-stone-500"><tr><th className="p-4">عضو</th><th className="p-4">تماس</th><th className="p-4">نقش</th><th className="p-4">وضعیت</th><th className="p-4">عملیات</th></tr></thead><tbody className="divide-y divide-stone-100">{users.map((user) => <tr key={user.id}><td className="p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-violet-100 text-violet-700"><UserCog className="size-4" /></span><div><p className="font-black text-stone-900">{user.full_name || user.username}</p><p className="mt-1 font-mono text-[10px] text-stone-400">{user.username}</p></div></div></td><td className="p-4 text-stone-500">{user.phone || user.email}</td><td className="p-4"><select value={user.role} disabled={user.role === "super_admin"} onChange={(event) => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role: event.target.value } : item))} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold"><option value="super_admin">{roleLabels.super_admin}</option><option value="admin">{roleLabels.admin}</option><option value="editor">{roleLabels.editor}</option><option value="operator">{roleLabels.operator}</option></select></td><td className="p-4"><button type="button" disabled={user.role === "super_admin"} onClick={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, is_active: item.is_active ? 0 : 1 } : item))} className={`rounded-full px-3 py-1 text-[10px] font-black ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{user.is_active ? "فعال" : "متوقف"}</button></td><td className="p-4"><button type="button" onClick={() => void save(user)} className="rounded-xl bg-violet-700 px-4 py-2 font-black text-white hover:bg-violet-800">{saved === user.id ? "ذخیره شد" : "ذخیره دسترسی"}</button></td></tr>)}</tbody></table></div>
    </div>
  </div>;
}
