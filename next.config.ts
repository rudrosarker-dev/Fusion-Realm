// START OF FILE next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ["image/avif", "image/webp"], // Next.js স্বয়ংক্রিয়ভাবে সাইজ ছোট করবে
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // সব সোর্স থেকে ইমেজ এলাও করা (DB/Vercel/External)
      },
    ],
    minimumCacheTTL: 31536000, // ১ বছরের জন্য ইমেজ ক্যাশ করবে
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"], // বান্ডেল সাইজ কমাবে
  },
};

export default nextConfig;
// END OF FILE next.config.ts
