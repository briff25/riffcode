import type { NextConfig } from "next";

// Pair Networks serves plain files from Apache, so the whole site is exported
// to out/ at build time. trailingSlash makes every route a folder/index.html.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // One page, mostly first-time visitors: ship Tailwind's CSS inside the HTML
  // instead of a render-blocking stylesheet request.
  experimental: { inlineCss: true },
};

export default nextConfig;
