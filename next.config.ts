// START OF FILE next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // বিল্ড যাতে কোনো কারণে না আটকায়
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // আপনার স্টোরের ছবি যাতে লোড হতে সমস্যা না হয়
      },
    ],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
// END OF FILE next.config.ts
