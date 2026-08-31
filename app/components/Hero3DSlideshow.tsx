"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
      return parsed.length > 0 ? parsed : DEFAULT_HOME_SLIDES;
    } catch { return DEFAULT_HOME_SLIDES; }
  });
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 70, damping: 20 });
  const mouseY = useSpring(rawY, { stiffness: 70, damping: 20 });
  const imageX = useTransform(mouseX, [-0.5, 0.5], [-18, 18]);
  const imageY = useTransform(mouseY, [-0.5, 0.5], [-18, 18]);
  const frameRotate = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((value) => (value + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;
  const changeSlide = (offset: number) => {
    setDirection(offset);
    setCurrent((value) => (value + offset + slides.length) % slides.length);
  };

  return (
    <div dir="rtl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); rawX.set(0); rawY.set(0); }} onMouseMove={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      rawX.set((event.clientX - rect.left) / rect.width - 0.5);
      rawY.set((event.clientY - rect.top) / rect.height - 0.5);
    }} className="relative isolate overflow-hidden rounded-[2.5rem] bg-stone-950 font-sans text-white shadow-2xl">
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-90 transition-all duration-1000`} />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_22%),radial-gradient(circle_at_80%_75%,#f0abfc_0,transparent_25%)]" />
      <div className="relative z-10 grid min-h-[460px] items-center gap-8 p-8 sm:p-12 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md"><Sparkles className="size-4 text-amber-400" /><span className="text-xs font-bold text-amber-300">{slide.badge}</span></div>
          <AnimatePresence mode="wait" custom={direction}><motion.div key={slide.id} initial={{ opacity: 0, x: direction * -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * 40 }} transition={{ duration: 0.45 }}>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{slide.title}</h1>
            <p className="mt-5 text-sm leading-7 text-stone-200 sm:text-base">{slide.subtitle}</p>
          </motion.div></AnimatePresence>
          <div className="flex flex-wrap gap-4"><Link href={slide.ctaLink} className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-stone-950 shadow-lg transition hover:-translate-y-1">{slide.ctaText}<ArrowLeft className="size-4" /></Link><Link href="/virtual-tryon" className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold backdrop-blur-md transition hover:bg-white/20">پرو آنلاین با عکس</Link></div>
        </div>
        <div className="relative flex justify-center lg:col-span-5"><motion.div style={{ rotateY: frameRotate }} className="relative [transform-style:preserve-3d]"><div className="absolute -bottom-8 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-black/60 blur-2xl" /><div className="relative rounded-[2rem] bg-gradient-to-br from-white/70 via-fuchsia-300/60 to-violet-500/70 p-3 shadow-2xl"><div className="relative size-64 overflow-hidden rounded-[1.5rem] border-2 border-white/30 bg-stone-950/40 shadow-inner sm:size-80"><img src={slide.image} alt={slide.title} className="editorial-image size-full object-cover" /></div><motion.div style={{ x: imageX, y: imageY }} className="pointer-events-none absolute -bottom-8 -left-5 size-40 rounded-full bg-gradient-to-br from-amber-300/70 to-pink-500/20 blur-2xl" /></div></motion.div></div>
      </div>
      <div className="absolute bottom-6 left-8 z-20 flex items-center gap-2"><button onClick={() => changeSlide(-1)} aria-label="اسلاید قبلی" className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"><ChevronRight className="size-4" /></button>{slides.map((item, index) => <button key={item.id} onClick={() => { setDirection(index > current ? 1 : -1); setCurrent(index); }} aria-label={`اسلاید ${index + 1}`} className={`h-2.5 rounded-full transition-all ${current === index ? "w-8 bg-amber-400" : "w-2.5 bg-white/40"}`} />)}<button onClick={() => changeSlide(1)} aria-label="اسلاید بعدی" className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"><ChevronLeft className="size-4" /></button></div>
    </div>
  );
}
