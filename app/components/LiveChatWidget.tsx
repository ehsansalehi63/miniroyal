"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const whatsappHref = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("سلام، برای انتخاب لباس و سایز راهنمایی می‌خواهم.")}`
  : "#";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "سلام! 👋 خوش آمدید به مینی رویال. من مشاور آنلاین انتخاب لباس کودک هستم. چطور می‌تونم در انتخاب سایز یا ست پاییزی راهنماییتون کنم؟",
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // پاسخ هوشمند آنلاین خودکار
    setTimeout(() => {
      let reply = "ممنون از پیامتان! کارشناسان پشتیبانی مینی رویال پیام شما را دریافت کردند و تا لحظاتی دیگر پاسخ می‌دهند.";
      
      const lower = userMsg.text.toLowerCase();
      if (lower.includes("سایز") || lower.includes("قد") || lower.includes("وزن")) {
        reply = "برای انتخاب سایز دقیق پیشنهاد می‌کنم از ابزار «پرو آنلاین» بالای سایت استفاده کنید یا قد و وزن کودک را اینجا بفرستید تا دقیقاً سایز مناسب را براتون محاسبه کنم! 👗";
      } else if (lower.includes("ارسال") || lower.includes("پست") || lower.includes("تیپاکس")) {
        reply = "ارسال‌های بالای ۵۰۰ هزار تومان کاملاً رایگان است! مرسوله‌ها با پست پیشتاز یا تیپاکس ظرف ۲۴ الی ۴۸ ساعت ارسال می‌شوند. 🚚";
      } else if (lower.includes("قیمت") || lower.includes("تخفیف")) {
        reply = "کدهای تخفیف MINI10 (ده درصد) و ROYAL50 (پنجاه هزار تومان) هم‌اکنون فعال هستند و می‌توانید در سبد خرید اعمال کنید! 🏷️";
      }

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: reply,
        time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans dir-rtl">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 px-5 py-3.5 text-white shadow-2xl transition-all hover:scale-105 hover:shadow-violet-500/50"
          aria-label="چت آنلاین و مشاوره خرید"
        >
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-amber-400" />
          </span>
          <MessageCircle className="size-5" />
          <span className="text-xs font-black">مشاوره خرید و چت آنلاین</span>
        </button>
      )}

      {isOpen && (
        <div className="flex h-[500px] w-[360px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl transition-all sm:w-[400px]">
          {/* هدر چت */}
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-700 via-fuchsia-600 to-violet-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-10 overflow-hidden rounded-2xl bg-white/20 shadow-inner">
                <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" />
              </span>
              <div>
                <span className="block text-sm font-black">پشتیبانی آنلاین مینی رویال</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  پاسخگویی آنلاین و مشاوره سایز
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
              aria-label="بستن"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* متن پیام‌ها */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                    m.sender === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-fuchsia-100 text-fuchsia-800"
                  }`}
                >
                  {m.sender === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>

                <div
                  className={`max-w-[78%] rounded-2xl p-3 shadow-sm ${
                    m.sender === "user"
                      ? "bg-violet-700 text-white rounded-br-none"
                      : "bg-white text-stone-800 border border-stone-200 rounded-bl-none"
                  }`}
                >
                  <p className="leading-5">{m.text}</p>
                  <span
                    className={`mt-1 block text-[9px] ${
                      m.sender === "user" ? "text-violet-200" : "text-stone-400"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* فرم ارسال پیام */}
          <form onSubmit={handleSend} className="border-t border-stone-200 bg-white p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال خود را بنویسید..."
              className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs outline-none focus:border-violet-500 focus:bg-white"
            />
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-2xl bg-violet-700 text-white shadow-md hover:bg-violet-800"
              aria-label="ارسال"
            >
              <Send className="size-4 rotate-180" />
            </button>
          </form>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={`m-3 flex items-center justify-center rounded-xl py-3 text-xs font-black text-white ${whatsappNumber ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-stone-300"}`} aria-disabled={!whatsappNumber}>
            انتقال مستقیم گفتگو به واتساپ
          </a>
        </div>
      )}
    </div>
  );
}
