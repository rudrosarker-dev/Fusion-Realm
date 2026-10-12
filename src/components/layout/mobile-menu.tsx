// START OF FILE src/components/layout/mobile-menu.tsx
"use client";

import { ChevronDown, Heart, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CURRENCIES, NAV } from "@/lib/config";
import { useUI, useWishlist } from "@/lib/store";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/types";

function Section({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: { label: string; href: string }[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-[0.18em] cursor-pointer"
      >
        {title}
        <ChevronDown className={cn("size-4 text-fog transition-transform duration-300", open && "rotate-180")} strokeWidth={1.5} />
      </button>
      <div className={cn("grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]", open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
        <ul className="flex flex-col gap-3 overflow-hidden pl-3">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link href={l.href} prefetch={true} onClick={onNavigate} className="text-sm text-ash transition-colors hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MobileMenu() {
  const { menuOpen, setMenuOpen, currency, setCurrency } = useUI();
  const { ids } = useWishlist();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"en" | "bn">("en");

  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    };
    const saved = getCookie("googtrans");
    if (saved?.includes("/bn")) {
      setCurrentLang("bn");
    } else {
      setCurrentLang("en");
    }
  }, []);

  const changeLanguage = (lang: "en" | "bn") => {
    if (lang === currentLang) return;
    const domain = window.location.hostname;
    const cookieVal = lang === "bn" ? "/en/bn" : "/en/en";
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    window.location.reload();
  };

  const close = () => {
    setMenuOpen(false);
    setCurrencyOpen(false);
    setLangOpen(false);
  };

  return (
    <div className={cn("fixed inset-0 z-[115] lg:hidden", !menuOpen && "pointer-events-none")} aria-hidden={!menuOpen}>
      <div
        className={cn("absolute inset-0 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-400", menuOpen ? "opacity-100" : "opacity-0")}
        onClick={close}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "absolute left-0 top-0 flex h-full w-[78%] max-w-[320px] flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <span className="font-display text-sm tracking-[0.26em] uppercase truncate">{BRAND_CONFIG.brandName}</span>
          <button aria-label="Close menu" onClick={close} className="flex size-9 items-center justify-center cursor-pointer">
            <span aria-hidden className="relative block size-4">
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 rotate-45 bg-ink" />
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 -rotate-45 bg-ink" />
            </span>
          </button>
        </div>

        <nav aria-label="Mobile" className="thin-scroll flex-1 overflow-y-auto px-5 py-2">
          <Section title="Shop" links={NAV.shop} onNavigate={close} />
          <Section title="Men" links={NAV.men} onNavigate={close} />
          <Section title="Women" links={NAV.women} onNavigate={close} />
          <Section title="Collections" links={NAV.collections} onNavigate={close} />

          <div className="border-b border-line py-4">
            <Link
              href="/wishlist"
              prefetch={true}
              onClick={close}
              className="flex items-center justify-between text-sm font-medium uppercase tracking-[0.18em] text-ink hover:text-ash transition-colors"
            >
              <span className="flex items-center gap-2">
                <Heart className="size-4" strokeWidth={1.5} /> Wishlist
              </span>
              <span className="text-xs text-fog font-mono font-normal">
                {ids.length > 0 ? `${ids.length} pieces` : "Empty"}
              </span>
            </Link>
          </div>

          {/* মোবাইল ল্যাঙ্গুয়েজ ড্রপডাউন */}
          <div className="border-b border-line">
            <button
              type="button"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((o) => !o)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-[0.18em] cursor-pointer"
            >
              <span className="flex items-center gap-2"><Globe className="size-3.5 text-fog" /> Language / ভাষা</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink font-mono font-bold">{currentLang === "bn" ? "বাংলা" : "EN"}</span>
                <ChevronDown className={cn("size-4 text-fog transition-transform duration-300", langOpen && "rotate-180")} strokeWidth={1.5} />
              </div>
            </button>
            <div className={cn("grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]", langOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden flex flex-col gap-2.5 pl-3">
                <button
                  type="button"
                  onClick={() => changeLanguage("en")}
                  className={cn(
                    "text-left text-sm py-1 transition-colors cursor-pointer flex items-center justify-between pr-2",
                    currentLang === "en" ? "font-semibold text-ink" : "text-ash hover:text-ink"
                  )}
                >
                  <span>English (Default)</span>
                  {currentLang === "en" && <span className="text-xs text-ink">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage("bn")}
                  className={cn(
                    "text-left text-sm py-1 transition-colors cursor-pointer flex items-center justify-between pr-2",
                    currentLang === "bn" ? "font-semibold text-ink" : "text-ash hover:text-ink"
                  )}
                >
                  <span>বাংলা (Bengali)</span>
                  {currentLang === "bn" && <span className="text-xs text-ink">✓</span>}
                </button>
              </div>
            </div>
          </div>

          {/* কারেন্সি অপশন */}
          <div className="border-b border-line">
            <button
              type="button"
              aria-expanded={currencyOpen}
              onClick={() => setCurrencyOpen((o) => !o)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-[0.18em] cursor-pointer"
            >
              <span>Region / Currency</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-fog font-mono font-semibold">{currency}</span>
                <ChevronDown className={cn("size-4 text-fog transition-transform duration-300", currencyOpen && "rotate-180")} strokeWidth={1.5} />
              </div>
            </button>
            <div className={cn("grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]", currencyOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden flex flex-col gap-2.5 pl-3">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCurrency(c.code as Currency);
                      setCurrencyOpen(false);
                    }}
                    className={cn(
                      "text-left text-sm py-1 transition-colors cursor-pointer flex items-center justify-between pr-2",
                      currency === c.code ? "font-semibold text-ink" : "text-ash hover:text-ink"
                    )}
                  >
                    <span>{c.label}</span>
                    {currency === c.code && <span className="text-xs text-ink">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-line px-5 py-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fog">
            © {new Date().getFullYear()} {BRAND_CONFIG.brandName}
          </p>
        </div>
      </div>
    </div>
  );
}
// END OF FILE src/components/layout/mobile-menu.tsx
