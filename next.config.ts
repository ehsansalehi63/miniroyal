import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All artwork is self-hosted under /public — no external image CDNs,
    // so the storefront renders fully with or without VPN/DNS filtering.
    unoptimized: true,
  },
};

export default nextConfig;
