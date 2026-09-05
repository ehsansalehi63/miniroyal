import Link from "next/link";
import { blogPosts } from "../lib/blogPosts";

export const metadata = {
  title: "مجله تخصصی و بلاگ پوشاک کودک | مینی رویال",
  description: "راهنمای کامل خرید لباس کودک، انتخاب سایز، نگهداری از پارچه، و استایل فرزندان.",
};

const articles = blogPosts;

export default function BlogListPage() {
  return (
    <div className="mx-auto site-container px-4 py-8">
      {/* مسیر خرده‌نانی */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-violet-700">خانه</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">مجله آموزشی مینی رویال</span>
      </nav>

      <div className="mb-10 text-center">
        <span className="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-800">
          📚 مجله تخصصی پوشاک کودک
        </span>
        <h1 className="mt-4 text-3xl font-black text-stone-900 sm:text-4xl">
          راهنماهای خرید، سایزبندی و استایل کودک
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs text-stone-600 sm:text-sm">
          جدیدترین مقالات آموزشی درباره سلامت پوست نوزاد، نحوه انتخاب سایز و شست‌وشو.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="group flex flex-col overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm transition hover:shadow-xl"
          >
            <div className="aspect-video w-full overflow-hidden bg-stone-100">
              <img
                src={article.image}
                alt={article.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between text-xs font-bold text-violet-700">
                <span>{article.category}</span>
                <span className="text-stone-400 font-normal">{article.date}</span>
              </div>
              <h2 className="mt-3 text-lg font-black text-stone-900 group-hover:text-violet-700">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>
              <p className="mt-2 text-xs leading-6 text-stone-600 flex-1">
                {article.summary}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold text-stone-500">
                <span>نویسنده: {article.author}</span>
                <Link
                  href={`/blog/${article.slug}`}
                  className="font-bold text-violet-700 hover:underline"
                >
                  ادامه مطلب ←
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
