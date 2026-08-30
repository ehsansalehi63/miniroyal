"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Wand2, Loader2 } from "lucide-react";

interface DropzoneImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function DropzoneImageUploader({ images, onChange }: DropzoneImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    fileList.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            onChange([...images, dataUrl]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // AI Image Generation using `/api/ai-image`
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiStatusMessage("هوش مصنوعی در حال تحلیل پرامپت و تولید تصویر آتلیه‌ای لباس است...");

    try {
      const res = await fetch("/api/ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        onChange([data.imageUrl, ...images]);
        setAiStatusMessage("✅ تصویر فتورئالیستیک با موفقیت تولید و به کاتالوگ اضافه شد!");
        setAiPrompt("");
      } else {
        setAiStatusMessage("⚠️ خطا در تولید تصویر. تصویر جایگزین قرار داده شد.");
      }
    } catch (err) {
      console.error("AI Image Generation Error:", err);
      setAiStatusMessage("⚠️ خطا در ارتباط با هوش مصنوعی.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 font-sans dir-rtl">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-stone-800">
          مدیریت و آپلود تصاویر محصول (Drag & Drop + تولید هوش مصنوعی 🪄)
        </label>
      </div>

      {/* بخش ابزار تولید و بهینه‌سازی تصویر با هوش مصنوعی (AI Prompt Image Generator) */}
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-fuchsia-50/40 to-stone-50 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-violet-600 text-white shadow-sm text-sm">
            🪄
          </span>
          <div>
            <h4 className="text-xs font-black text-violet-950">تولید هوشمند تصویر لباس با هوش مصنوعی (AI Studio)</h4>
            <p className="text-[10px] text-stone-500">
              توضیحات فارسی لباس را وارد کنید؛ هوش مصنوعی پرامپت را بهینه‌سازی کرده و عکس آتلیه‌ای می‌سازد.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="مثال: هودی گرم پاییزی پسرانه آبی نفتی با طرح خرس رویایی"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAIGenerate();
              }
            }}
            className="flex-1 rounded-2xl border border-violet-200 bg-white p-2.5 text-xs outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 shadow-inner"
          />

          <button
            type="button"
            disabled={isGenerating || !aiPrompt.trim()}
            onClick={handleAIGenerate}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-violet-800 hover:to-fuchsia-800 disabled:opacity-50 transition"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>در حال ساخت...</span>
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                <span>تولید عکس 🪄</span>
              </>
            )}
          </button>
        </div>

        {aiStatusMessage && (
          <p className="text-[11px] font-bold text-violet-800 bg-white/70 p-2 rounded-xl border border-violet-100">
            {aiStatusMessage}
          </p>
        )}
      </div>

      {/* منطقه درگ و دراپ معمولی */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center cursor-pointer rounded-3xl border-2 border-dashed p-5 text-center transition-all ${
          isDragging
            ? "border-violet-600 bg-violet-50 scale-[1.01]"
            : "border-stone-300 bg-stone-50 hover:border-violet-500 hover:bg-violet-50/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="grid size-10 place-items-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm transition group-hover:scale-110">
          <UploadCloud className="size-5" />
        </div>

        <p className="mt-2 text-xs font-bold text-stone-800">
          عکس‌های دلخواه را اینجا **رها کنید** (Drag & Drop) یا برای آپلود از موبایل/کامپیوتر کلیک کنید
        </p>
      </div>

      {/* گالری تصاویر آپلود یا تولید شده */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-1">
          {images.map((img, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
              <img src={img} alt={`تصویر ${idx + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-rose-600 text-white shadow-md transition hover:scale-110"
                title="حذف عکس"
              >
                <X className="size-3.5" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 rounded-md bg-violet-800/90 px-1.5 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">
                  عکس اصلی
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
