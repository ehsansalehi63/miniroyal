"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";

interface DropzoneImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function DropzoneImageUploader({ images, onChange }: DropzoneImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
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

  return (
    <div className="space-y-3 font-sans dir-rtl">
      <label className="block text-xs font-black text-stone-800">
        مدیریت و آپلود تصاویر محصول (Drag & Drop یا انتخاب از موبایل/کامپیوتر)
      </label>

      {/* منطقه درگ و دراپ */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition-all ${
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

        <div className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm transition group-hover:scale-110">
          <UploadCloud className="size-6" />
        </div>

        <p className="mt-3 text-xs font-bold text-stone-800">
          عکس‌ها را اینجا **رها کنید** (Drag & Drop) یا کلیک کنید
        </p>
        <p className="mt-1 text-[10px] text-stone-500">
          پشتیبانی از فرمت‌های JPG, PNG, WEBP از گالری موبایل یا کامپیوتر
        </p>
      </div>

      {/* گالری تصاویر آپلود شده */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-2">
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
