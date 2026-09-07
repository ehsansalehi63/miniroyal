"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Loader2, Sparkles, UploadCloud, Wand2, X } from "lucide-react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function DropzoneImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<"upload" | "ai" | null>(null);
  const [message, setMessage] = useState("");

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/media/upload", { method: "POST", body: formData, signal: AbortSignal.timeout(60_000) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data.url) throw new Error(data?.error || "آپلود تصویر انجام نشد.");
    return String(data.url);
  };

  const editImage = async (source: string, customPrompt = "", targetIndex = selected, baseImages = images) => {
    setBusy("ai");
    setMessage("در حال ویرایش تصویر با هوش مصنوعی؛ تصویر اصلی تا پایان کار حفظ می‌شود...");
    try {
      const response = await fetch("/api/ai-image-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: source, prompt: customPrompt }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.imageUrl) throw new Error(data?.error || "ویرایش تصویر ناموفق بود.");
      const next = [...baseImages];
      next[targetIndex] = String(data.imageUrl);
      onChange(next);
      setPrompt("");
      setMessage("تصویر با موفقیت با AI ویرایش شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ویرایش تصویر انجام نشد؛ تصویر اصلی حفظ شد.");
    } finally {
      setBusy(null);
    }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter((file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024);
    if (!valid.length) {
      setMessage("فقط تصویر JPG، PNG یا WebP با حجم کمتر از ۸ مگابایت قابل استفاده است.");
      return;
    }
    setBusy("upload");
    setMessage(`در حال آپلود ${valid.length} تصویر...`);
    try {
      const uploaded: string[] = [];
      for (const [index, file] of valid.entries()) {
        setMessage(`در حال آپلود تصویر ${index + 1} از ${valid.length}...`);
        uploaded.push(await uploadFile(file));
      }
      const firstIndex = images.length;
      const combinedImages = [...images, ...uploaded];
      onChange(combinedImages);
      setSelected(firstIndex);
      setMessage(`${uploaded.length} تصویر با موفقیت آپلود شد. برای ویرایش AI، تصویر را انتخاب کنید.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "آپلود تصویر انجام نشد.");
    } finally {
      setBusy(null);
    }
  };

  const onInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) await addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    await addFiles(event.dataTransfer.files);
  };

  const runCustomEdit = async () => {
    if (!images[selected]) return;
    await editImage(images[selected], prompt.trim());
  };

  return (
    <div dir="rtl" className="space-y-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-amber-700" />
          <div>
            <p className="text-xs font-black text-amber-950">ویرایش اختیاری عکس محصول با AI</p>
            <p className="mt-1 text-[10px] text-amber-900">آپلود مستقل انجام می‌شود؛ AI فقط وقتی شما درخواست کنید اجرا می‌شود و تصویر اصلی از بین نمی‌رود.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="مثلاً: پس‌زمینه روشن‌تر و چروک کمتر" className="min-w-[220px] flex-1 rounded-xl border border-stone-200 bg-white p-2 text-xs outline-none focus:border-amber-500" />
          <button type="button" onClick={() => void runCustomEdit()} disabled={Boolean(busy) || !images[selected]} className="flex items-center gap-1 rounded-xl bg-stone-950 px-3 py-2 text-xs font-black text-white hover:bg-stone-800 transition disabled:opacity-50">
            {busy === "ai" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4 text-amber-400" />} ویرایش با دستور
          </button>
          <button type="button" onClick={() => void editImage(images[selected])} disabled={Boolean(busy) || !images[selected]} className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50">
            {busy === "ai" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-amber-600" />} آماده‌سازی کاتالوگ
          </button>
        </div>
        {message && <p className="mt-2 text-[11px] font-bold text-amber-900">{message}</p>}
      </div>

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? "border-amber-600 bg-amber-100" : "border-stone-300 bg-stone-50 hover:border-amber-500"}`}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onInput} />
        {busy === "upload" ? <Loader2 className="size-8 animate-spin text-amber-600" /> : <UploadCloud className="size-8 text-amber-600" />}
        <p className="mt-2 text-xs font-bold text-stone-800">عکس واقعی لباس را آپلود یا اینجا رها کنید</p>
        <p className="mt-1 text-[10px] text-stone-500">تصویر بلافاصله در فضای رسانه ذخیره می‌شود؛ ویرایش AI جداگانه و اختیاری است.</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button key={`${image}-${index}`} type="button" onClick={() => setSelected(index)} className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${selected === index ? "border-amber-600 ring-2 ring-amber-200" : "border-stone-200"}`}>
              <img src={image} alt={`تصویر محصول ${index + 1}`} className="size-full object-cover" />
              <span onClick={(event) => { event.stopPropagation(); onChange(images.filter((_, i) => i !== index)); setSelected(Math.max(0, Math.min(selected, images.length - 2))); }} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white">
                <X className="size-3" />
              </span>
              {index === 0 && <span className="absolute bottom-1 right-1 rounded bg-stone-950 px-1 text-[9px] font-bold text-white">اصلی</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
