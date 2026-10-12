"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LS_KEYS, readLS, writeLS } from "@/lib/utils";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readLS<string | null>(LS_KEYS.cookie, null)) {
      const t = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    writeLS(LS_KEYS.cookie, "essential");
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[105] border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-md img-fade sm:left-6 sm:right-auto sm:max-w-md sm:border"
    >
      <p className="text-xs leading-relaxed text-ash">
        This site uses only essential browser storage for your bag, wishlist and preferences — no tracking cookies.{" "}
        <Link href="/cookies" className="underline underline-offset-2">
          Cookie policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          className="bg-ink px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ash"
        >
          Accept
        </button>
        <button
          onClick={accept}
          className="border border-line px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-ink"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
