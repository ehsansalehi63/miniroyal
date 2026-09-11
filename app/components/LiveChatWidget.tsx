"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Send, User, X } from "lucide-react";

type SuggestedProduct = { title: string; slug: string; image: string; price: number; sizes: string[]; stock: number; category: string };
type Message = { id: string; sender: "bot" | "user"; text: string; time: string; products?: SuggestedProduct[]; whatsappUrl?: string | null };

const now = () => new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
const toman = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function LiveChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", sender: "bot", text: "سلام! من مشاور تخصصی پوشاک کودک و نوجوان مینی رویال هستم. درباره مدل، موجودی، قیمت یا سایز سؤال دارید؟ قد، وزن و سن کودک را بفرستید تا دقیق‌تر راهنمایی کنم.", time: now() },
  ]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/ehsanpaneladmin") || pathname?.startsWith("/deltadasht-proposal")) return null;

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setMessages((previous) => [...previous, { id: `${Date.now()}-u`, sender: "user", text: question, time: now() }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/shop-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await response.json();
      setMessages((previous) => [...previous, {
        id: `${Date.now()}-b`, sender: "bot",
        text: data.success ? data.answer : (data.error || "ارتباط با مشاور فروشگاه برقرار نشد."),
        time: now(), products: data.products || [], whatsappUrl: data.whatsappUrl,
      }]);
    } catch {
      setMessages((previous) => [...previous, { id: `${Date.now()}-e`, sender: "bot", text: "ارتباط با مشاور فروشگاه موقتاً برقرار نشد. لطفاً از واتساپ با کارشناس تماس بگیرید.", time: now() }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 font-sans sm:bottom-6 sm:right-6">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="group flex items-center gap-3 rounded-full border border-amber-500/30 bg-stone-950 px-5 py-3.5 text-white shadow-2xl transition hover:scale-105" aria-label="چت مشاور خرید">
          <span className="relative flex size-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex size-3 rounded-full bg-amber-400" /></span>
          <MessageCircle className="size-5 text-amber-400" />
          <span className="text-xs font-black">مشاوره خرید و چت آنلاین</span>
        </button>
      )}

      {isOpen && (
        <div className="flex h-[590px] w-[360px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-amber-500/30 bg-stone-950 p-4 text-white">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-amber-400/15"><Bot className="size-5 text-amber-300" /></span><div><span className="block text-sm font-black text-amber-100">مشاور تخصصی مینی رویال</span><span className="text-[10px] font-bold text-emerald-300">موجودی و محصولات واقعی سایت</span></div></div>
            <button onClick={() => setIsOpen(false)} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20" aria-label="بستن"><X className="size-5" /></button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4 text-xs">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2.5 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`grid size-7 shrink-0 place-items-center rounded-xl ${message.sender === "user" ? "bg-amber-700 text-white" : "bg-stone-200 text-stone-800"}`}>{message.sender === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}</div>
                <div className={`max-w-[86%] rounded-2xl p-3 shadow-sm ${message.sender === "user" ? "rounded-br-none bg-stone-900 text-white" : "rounded-bl-none border border-stone-200 bg-white text-stone-800"}`}>
                  <p className="whitespace-pre-line leading-5">{message.text}</p>
                  {message.products?.length ? <div className="mt-3 space-y-2">{message.products.map((product) => <a key={product.slug} href={`/product/${product.slug}`} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2 transition hover:border-amber-400 hover:bg-amber-50"><img src={product.image} alt={product.title} className="size-12 rounded-lg bg-white object-contain" /><span className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{product.title}</strong><span className="mt-1 block text-[10px] text-stone-500">{toman(product.price)} تومان · {product.sizes.length ? `سایز ${product.sizes.join("، ")}` : "موجود"}</span></span><span className="text-[10px] font-black text-amber-800">مشاهده</span></a>)}</div> : null}
                  {message.whatsappUrl ? <a href={message.whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-[11px] font-black text-white hover:bg-emerald-700">ارتباط مستقیم با کارشناس در واتساپ</a> : null}
                  <span className={`mt-1 block text-[9px] ${message.sender === "user" ? "text-stone-300" : "text-stone-400"}`}>{message.time}</span>
                </div>
              </div>
            ))}
            {busy ? <div className="mr-9 rounded-2xl rounded-bl-none border border-stone-200 bg-white p-3 text-[11px] text-stone-500">در حال بررسی کاتالوگ و موجودی واقعی…</div> : null}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-stone-200 bg-white p-3">
            <input type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="مثلاً لباس دخترانه برای ۶ سال…" className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs outline-none focus:border-amber-500 focus:bg-white" />
            <button type="submit" disabled={busy} className="grid size-10 place-items-center rounded-2xl bg-stone-950 text-amber-400 shadow-md transition hover:bg-stone-800 disabled:opacity-50" aria-label="ارسال"><Send className="size-4 rotate-180" /></button>
          </form>
        </div>
      )}
    </div>
  );
}
