"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Loader2, Sparkles, UploadCloud, Wand2, X } from "lucide-react";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

function readFile(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("خواندن تصویر انجام نشد."));
    reader.readAsDataURL(file);
  });
}

export default function DropzoneImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const editImage = async (source: string, customPrompt = "", targetIndex = selected, baseImages = images) => {
    setBusy(true);
    setMessage("در حال آماده‌سازی خودکار عکس برای کاتالوگ و پرو آنلاین...");
    try {
      const response = await fetch("/api/ai-image-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: source, prompt: customPrompt }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.imageUrl) throw new Error(data.error || "ویرایش تصویر ناموفق بود.");
      const next = [...baseImages];
      next[targetIndex] = data.imageUrl;
      onChange(next);
      setPrompt("");
      setMessage("تصویر با موفقیت برای کاتالوگ و پرو آنلاین آماده شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ویرایش تصویر انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter((file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024);
    if (!valid.length) {
      setMessage("فقط تصویر معتبر با حجم کمتر از ۸ مگابایت قابل استفاده است.");
      return;
    }
    const newImages = await Promise.all(valid.map(readFile));
    const firstIndex = images.length;
    const combinedImages = [...images, ...newImages];
    onChange(combinedImages);
    setSelected(firstIndex);
    await editImage(newImages[0], "", firstIndex, combinedImages);
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
    if (!images[selected] || !prompt.trim()) return;
    await editImage(images[selected], prompt);
  };

  return (
    <div dir="rtl" className="space-y-3">
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-violet-700" />
          <div>
            <p className="text-xs font-black text-violet-950">ویرایش خودکار عکس محصول برای پرو آنلاین</p>
            <p className="mt-1 text-[10px] text-violet-800">بعد از آپلود، سرویس AI لباس را از بدن/چوب‌لباسی جدا و برای پرو استاندارد می‌کند.</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="مثلاً: رنگ را سرمه‌ای کن و چروک‌ها را کمتر کن" className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white p-2 text-xs outline-none" />
          <button type="button" onClick={runCustomEdit} disabled={busy || !prompt.trim() || !images[selected]} className="flex items-center gap-1 rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} ویرایش
          </button>
        </div>
        {message && <p className="mt-2 text-[11px] font-bold text-violet-800">{message}</p>}
      </div>

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? "border-violet-600 bg-violet-100" : "border-stone-300 bg-stone-50 hover:border-violet-500"}`}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onInput} />
        <UploadCloud className="size-8 text-violet-600" />
        <p className="mt-2 text-xs font-bold text-stone-800">عکس واقعی لباس را آپلود یا اینجا رها کنید</p>
        <p className="mt-1 text-[10px] text-stone-500">عکس اول به‌صورت خودکار برای کاتالوگ و پرو آنلاین ویرایش می‌شود.</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button key={`${image}-${index}`} type="button" onClick={() => setSelected(index)} className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${selected === index ? "border-violet-600" : "border-stone-200"}`}>
              <img src={image} alt={`تصویر محصول ${index + 1}`} className="size-full object-cover" />
              <span onClick={(event) => { event.stopPropagation(); onChange(images.filter((_, i) => i !== index)); setSelected(Math.max(0, selected - 1)); }} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white">
                <X className="size-3" />
              </span>
              {index === 0 && <span className="absolute bottom-1 right-1 rounded bg-violet-700 px-1 text-[9px] font-bold text-white">اصلی</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
