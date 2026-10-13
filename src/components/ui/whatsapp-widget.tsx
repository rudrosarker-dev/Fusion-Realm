// START OF FILE src/components/ui/whatsapp-widget.tsx
"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRAND_CONFIG } from "@/lib/brand.config";

export function WhatsAppWidget() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  // অ্যাডমিন এবং স্টাফ প্যানেলে এটি বন্ধ থাকবে
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/staff")) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${BRAND_CONFIG.contact.whatsappNumber}?text=Hello%20${encodeURIComponent(
    BRAND_CONFIG.brandName
  )}%20Concierge,%20I%20would%20like%20assistance%20with%20my%20order.`;

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-3">
      {/* মাউস নিলে ছোট লাক্সারি টুলটিপ ভেসে উঠবে */}
      {hovered && (
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-line bg-paper/95 px-4 py-2 text-xs text-ink shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-right-2">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium tracking-wide">Atelier Concierge Live</span>
        </div>
      )}

      {/* মেইন ফ্লোটিং বাটন: শ্যাম্পেন গোল্ড বেস কালার এবং হোভারে এমারেল্ড গ্রিন */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex size-12 sm:size-13 items-center justify-center rounded-full bg-[#c5a880] text-[#0e0d0b] shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-emerald-600 hover:text-white cursor-pointer"
      >
        <span className="absolute -inset-1 rounded-full border border-[#c5a880]/50 opacity-0 group-hover:opacity-100 transition-opacity animate-ping" />
        <MessageCircle className="size-5.5 sm:size-6" strokeWidth={1.75} />
      </a>
    </div>
  );
}
// END OF FILE src/components/ui/whatsapp-widget.tsx
