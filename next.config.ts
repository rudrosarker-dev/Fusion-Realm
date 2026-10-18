// START OF FILE next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // প্রোডাকশন বিল্ডে টাইপচেকিং ও লিন্ট এরর উপেক্ষা করা বন্ধ করা হয়েছে
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // ওয়াইল্ডকার্ড '**' এর বদলে নির্দিষ্ট হোস্ট এলাও করা হয়েছে
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
// END OF FILE next.config.ts
