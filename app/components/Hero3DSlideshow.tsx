"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_HOME_SLIDES, HomeSlide } from "../lib/homeConfig";

export default function Hero3DSlideshow() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [slides] = useState<HomeSlide[]>(() => {
    if (typeof window === "undefined") return DEFAULT_HOME_SLIDES;
    try {
      const saved = localStorage.getItem("miniroyal_home_slides_v2");
      const parsed = saved ? JSON.parse(saved) as HomeSlide[] : [];
      return parsed.length ? parsed : DEFAULT_HOME_SLIDES;
    } catch { return DEFAULT_HOME_SLIDES; }
  });
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotate = useSpring(useTransform(rawX, [-0.5, 0.5], [-4, 4]), { stiffness: 70, damping: 20 });
  const imageX = useSpring(useTransform(rawX, [-0.5, 0.5], [-12, 12]), { stiffness: 70, damping: 20 });
  const imageY = useSpring(useTransform(rawY, [-0.5, 0.5], [-12, 12]), { stiffness: 70, damping: 20 });

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => { setDirection(1); setCurrent((value) => (value + 1) % slides.length); }, 6500);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;
  const changeSlide = (offset: number) => { setDirection(offset); setCurrent((value) => (value + offset + slides.length) % slides.length); };

  return (
    <section dir="rtl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); rawX.set(0); rawY.set(0); }} onMouseMove={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      rawX.set((event.clientX - rect.left) / rect.width - 0.5);
      rawY.set((event.clientY - rect.top) / rect.height - 0.5);
    }} className="relative mx-auto min-h-[540px] max-w-7xl overflow-hidden bg-[#f2e9df] shadow-sm sm:min-h-[620px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,.8),transparent_28%),linear-gradient(120deg,#f1e5d8,#f8f4ef_55%,#e7d9d0)]" />
      <div className="absolute -left-24 -top-24 size-72 rounded-full border border-stone-900/10" />
      <div className="absolute -bottom-36 right-1/3 size-96 rounded-full border border-stone-900/10" />
      <div className="relative z-10 grid min-h-[540px] items-center gap-8 px-6 py-14 sm:min-h-[620px] sm:px-14 lg:grid-cols-2 lg:px-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={slide.id} custom={direction} initial={{ opacity: 0, x: direction * -35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * 35 }} transition={{ duration: .45 }} className="max-w-xl">
            <p className="mb-5 text-[11px] font-black uppercase tracking-[.22em] text-violet-800">Mini Royal / New Edit</p>
            <h1 className="max-w-lg text-4xl font-black leading-[1.2] tracking-tight text-stone-950 sm:text-6xl">{slide.title}</h1>
            <p className="mt-6 max-w-md text-sm leading-8 text-stone-600 sm:text-base">{slide.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><Link href={slide.ctaLink} className="inline-flex items-center gap-3 bg-stone-950 px-7 py-4 text-xs font-black text-white transition hover:bg-violet-800">{slide.ctaText}<ArrowLeft className="size-4" /></Link><Link href="/shop" className="border-b border-stone-950 px-2 py-3 text-xs font-black text-stone-950">مشاهده همه محصولات</Link></div>
            <div className="mt-12 flex gap-8 border-t border-stone-900/10 pt-5 text-xs font-bold text-stone-600"><span><b className="block text-xl text-stone-950">۱۰۰٪</b>انتخاب باکیفیت</span><span><b className="block text-xl text-stone-950">۷ روز</b>ضمانت بازگشت</span><span><b className="block text-xl text-stone-950">AI</b>پرو آنلاین</span></div>
          </motion.div>
        </AnimatePresence>
        <motion.div style={{ rotateY: rotate }} className="relative mx-auto w-full max-w-md [transform-style:preserve-3d]">
          <div className="absolute -inset-5 rounded-[50%] bg-white/50 blur-2xl" />
          <div className="relative aspect-[4/5] overflow-hidden bg-stone-200 shadow-2xl"><motion.img style={{ x: imageX, y: imageY, scale: 1.06 }} src={slide.image} alt={slide.title} className="editorial-image size-full object-cover" /></div>
          <span className="absolute -bottom-4 -right-4 bg-amber-300 px-5 py-3 text-[10px] font-black text-stone-950 shadow-xl">COLLECTION {String(slide.id).padStart(2, "0")}</span>
        </motion.div>
      </div>
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 sm:left-14"><button onClick={() => changeSlide(-1)} aria-label="اسلاید قبلی" className="grid size-9 place-items-center border border-stone-900/20 bg-white/50"><ChevronRight className="size-4" /></button>{slides.map((item, index) => <button key={item.id} onClick={() => { setDirection(index > current ? 1 : -1); setCurrent(index); }} aria-label={`اسلاید ${index + 1}`} className={`h-1.5 transition-all ${current === index ? "w-10 bg-stone-950" : "w-5 bg-stone-400"}`} />)}<button onClick={() => changeSlide(1)} aria-label="اسلاید بعدی" className="grid size-9 place-items-center border border-stone-900/20 bg-white/50"><ChevronLeft className="size-4" /></button></div>
    </section>
  );
}
