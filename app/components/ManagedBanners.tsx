import Link from "next/link";
import { getActiveBanners, BannerPlacement } from "../lib/banners";

export default async function ManagedBanners({ placement }: { placement: BannerPlacement }) {
  const banners = await getActiveBanners(placement);
  if (!banners.length) return null;
  return <div className="mx-auto my-6 w-full max-w-7xl space-y-4 px-4">{banners.map((banner) => <Link key={banner.id} href={banner.linkUrl || "#"} className="group block overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"><picture>{banner.mobileImageUrl && <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />}<img src={banner.imageUrl} alt={banner.title} className="h-auto max-h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.01]" /></picture><div className="sr-only">{banner.title}{banner.subtitle ? ` — ${banner.subtitle}` : ""}</div></Link>)}</div>;
}
