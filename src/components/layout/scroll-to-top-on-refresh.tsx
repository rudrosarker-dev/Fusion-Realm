"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTopOnRefresh() {
  const pathname = usePathname();

  useEffect(() => {
    // ব্রাউজারের অটো স্ক্রোল মেমোরি বন্ধ করে ম্যানুয়াল করা
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
