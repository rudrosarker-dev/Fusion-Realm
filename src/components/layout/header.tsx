// START OF FILE src/components/layout/header.tsx
"use client";

import { Search, ShoppingBag, User, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/config";
import { useCart, useUI } from "@/lib/store";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";

type NavKey = "shop" | "men" | "women" | "collections" | "journal";
type PanelKey = NavKey | null;

const TOP_NAV = [
  { key: "shop", label: "Shop", href: "/shop" },
  { key: "men", label: "Men", href: "/shop?gender=men" },
  { key: "women", label: "Women", href: "/shop?gender=women" },
  { key: "collections", label: "Collections", href: "/collections/new-season" },
  { key: "journal", label: "Journal", href: "/journal" },
] as const;

const DEFAULT_HEIGHTS: Record<NavKey, number> = {
  shop: 260,
  men: 380,
  women: 380,
  collections: 240,
  journal: 240,
};

export function Header() {
  const pathname = usePathname();
  const { setSearchOpen, cartOpen, setCartOpen, menuOpen, setMenuOpen } = useUI();
  const { count } = useCart();

  const [isAtTop, setIsAtTop] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [panel, setPanel] = useState<PanelKey>(null);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);

  const [menuBanners, setMenuBanners] = useState({
    men: "/images/category-men.jpg",
    women: "/images/category-women.jpg",
  });

  const [journalLinks, setJournalLinks] = useState<{ label: string; href: string }[]>([]);
  const [homepageMode, setHomepageMode] = useState<"editorial" | "direct-shop">("editorial");

  const [langExpanded, setLangExpanded] = useState(false);
  const [currentLang, setCurrentLang] = useState<"en" | "bn">("en");
  const langContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const match = document.cookie.match(new RegExp("(^| )googtrans=([^;]+)"));
    if (match?.[2]?.includes("/bn")) {
      setCurrentLang("bn");
    } else {
      setCurrentLang("en");
    }

    if (!document.getElementById("google-translate-script")) {
      (window as any).googleTranslateElementInit = () => {
        if ((window as any).google?.translate) {
          new (window as any).google.translate.TranslateElement(
            { pageLanguage: "en", includedLanguages: "en,bn", autoDisplay: false },
            "google_translate_element"
          );
        }
      };
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (langContainerRef.current && !langContainerRef.current.contains(e.target as Node)) {
        setLangExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    fetch("/api/banners")
      .then((res) => res.json())
      .then((data) => {
        if (data.banners) {
          setMenuBanners({
            men: data.banners.men || "/images/category-men.jpg",
            women: data.banners.women || "/images/category-women.jpg",
          });
        }
      })
      .catch(() => {});

    fetch("/api/journal")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles && Array.isArray(data.articles)) {
          setJournalLinks(
            data.articles.slice(0, 3).map((a: any) => ({
              label: a.title,
              href: `/journal/${a.slug}`,
            }))
          );
        }
      })
      .catch(() => {});

    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.content?.homepageMode) {
          setHomepageMode(data.content.homepageMode);
        }
      })
      .catch(() => {});

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pathname]);

  const changeLanguage = (lang: "en" | "bn") => {
    if (lang === currentLang) return;
    setCurrentLang(lang);
    const domain = window.location.hostname;
    const cookieVal = lang === "bn" ? "/en/bn" : "/en/en";
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    window.location.reload();
  };

  const PANELS: Record<NavKey, any> = {
    shop: {
      columns: [
        { heading: "Categories", links: NAV.shop },
        { heading: "Collections", links: NAV.collections.slice(0, 4) },
        {
          heading: "Information",
          links: [
            { label: "About Atelier", href: "/about" },
            { label: "Contact Us", href: "/contact" },
            { label: "Client FAQ", href: "/faq" },
          ],
        },
      ],
      featured: null,
    },
    men: {
      columns: [
        {
          heading: "Tops & Layers",
          links: [
            { label: "View All Men", href: "/shop?gender=men" },
            { label: "T-Shirts", href: "/shop?gender=men&category=T-Shirts" },
            { label: "Shirts", href: "/shop?gender=men&category=Shirts" },
            { label: "Hoodies", href: "/shop?gender=men&category=Hoodies" },
            { label: "Sweatshirts", href: "/shop?gender=men&category=Sweatshirts" },
            { label: "Knitwear", href: "/shop?gender=men&category=Knitwear" },
          ],
        },
        {
          heading: "Bottoms & More",
          links: [
            { label: "Bottoms", href: "/shop?gender=men&category=Bottoms" },
            { label: "Denim", href: "/shop?gender=men&category=Denim" },
            { label: "Outerwear", href: "/shop?gender=men&category=Outerwear" },
            { label: "Tailoring", href: "/shop?gender=men&category=Tailoring" },
            { label: "Footwear", href: "/shop?gender=men&category=Footwear" },
            { label: "Accessories", href: "/shop?gender=men&category=Accessories" },
          ],
        },
        {
          heading: "Curated",
          links: [
            { label: "New Arrivals", href: "/shop?gender=men&filter=new" },
            { label: "Best Sellers", href: "/shop?gender=men&filter=best" },
            { label: "Studio Collection", href: "/collections/studio" },
          ],
        },
      ],
      featured: {
        title: "Studio Menswear",
        subtitle: "Tailored wool & jersey",
        href: "/shop?gender=men",
        image: menuBanners.men,
      },
    },
    women: {
      columns: [
        {
          heading: "Tops & Dresses",
          links: [
            { label: "View All Women", href: "/shop?gender=women" },
            { label: "T-Shirts", href: "/shop?gender=women&category=T-Shirts" },
            { label: "Tops", href: "/shop?gender=women&category=Tops" },
            { label: "Dresses", href: "/shop?gender=women&category=Dresses" },
            { label: "Hoodies", href: "/shop?gender=women&category=Hoodies" },
            { label: "Knitwear", href: "/shop?gender=women&category=Knitwear" },
          ],
        },
        {
          heading: "Bottoms & Outerwear",
          links: [
            { label: "Bottoms", href: "/shop?gender=women&category=Bottoms" },
            { label: "Denim", href: "/shop?gender=women&category=Denim" },
            { label: "Outerwear", href: "/shop?gender=women&category=Outerwear" },
            { label: "Footwear", href: "/shop?gender=women&category=Footwear" },
            { label: "Accessories", href: "/shop?gender=women&category=Accessories" },
          ],
        },
        {
          heading: "Curated",
          links: [
            { label: "New Arrivals", href: "/shop?gender=women&filter=new" },
            { label: "Best Sellers", href: "/shop?gender=women&filter=best" },
            { label: "Limited Edition", href: "/collections/limited" },
          ],
        },
      ],
      featured: {
        title: "Womenswear Edit",
        subtitle: "Fluid draping & silk",
        href: "/shop?gender=women",
        image: menuBanners.women,
      },
    },
    collections: {
      columns: [
        { heading: "Core Collections", links: NAV.collections },
        {
          heading: "Documentation",
          links: [
            { label: "The Journal", href: "/journal" },
            { label: "Size & Fitting Guide", href: "/size-guide" },
          ],
        },
      ],
      featured: null,
    },
    journal: {
      columns: [
        {
          heading: "Editorial Posts",
          links: [{ label: "All Journal Entries", href: "/journal" }, ...journalLinks],
        },
        {
          heading: "Brand Philosophy",
          links: [
            { label: "About The Atelier", href: "/about" },
            { label: "Size & Fitting Guide", href: "/size-guide" },
            { label: "Client FAQ", href: "/faq" },
          ],
        },
      ],
      featured: null,
    },
  };

  const [panelHeights, setPanelHeights] = useState<Record<NavKey, number>>(DEFAULT_HEIGHTS);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHomePage = !pathname || pathname === "/" || pathname === "";
  const isHeroHomepage = isHomePage && homepageMode !== "direct-shop";
  const isMenuOpen = panel !== null;
  const isDarkTheme = isMenuOpen || (isHeroHomepage && isAtTop);

  const currentHeight = isMenuOpen && panel ? panelHeights[panel] || DEFAULT_HEIGHTS[panel] || 320 : 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const atTop = currentY <= 50;
      const delta = currentY - lastScrollY.current;

      setIsAtTop(atTop);

      if (atTop) {
        setHeaderVisible(true);
      } else if (delta > 8 && currentY > 100) {
        setHeaderVisible(false);
        setPanel(null);
      } else if (delta < -5) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (key: NavKey) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (panel !== null) {
      setPanel(key);
      return;
    }
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      setPanel(key);
    }, 90);
  };

  const handleMouseLeave = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setPanel(null);
    }, 180);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const iconBtn = cn(
    "relative flex size-9 items-center justify-center rounded-full transition-all duration-300 cursor-pointer",
    "hover:scale-110 active:scale-95",
    isDarkTheme
      ? "text-paper/90 hover:text-gold-light hover:bg-white/10"
      : "text-ink/80 hover:text-gold-dark hover:bg-gold/10"
  );

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[90] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          headerVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
        )}
        onMouseLeave={handleMouseLeave}
      >
        <div
          onMouseEnter={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
          }}
          style={{ height: isMenuOpen ? `${64 + currentHeight}px` : "64px" }}
          className={cn(
            "w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isMenuOpen
              ? "bg-ink/95 backdrop-blur-2xl border-b border-white/10 text-paper shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
              : isHeroHomepage && isAtTop
              ? "bg-ink/35 backdrop-blur-xl border-b border-white/10 text-paper shadow-none"
              : "bg-paper/90 backdrop-blur-xl border-b border-line/60 text-ink shadow-[0_4px_30px_-8px_rgba(14,13,11,0.08)]"
          )}
        >
          {/* ——— TOP BAR ——— */}
          <div className="h-16 grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12">
            {/* Left */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className={cn(iconBtn, "lg:hidden")}
              >
                <span className="sr-only">Menu</span>
                <span aria-hidden className="flex flex-col gap-[5px]">
                  <span
                    className={cn(
                      "h-px w-5 transition-all duration-300",
                      isDarkTheme ? "bg-paper" : "bg-ink"
                    )}
                  />
                  <span
                    className={cn(
                      "h-px w-3.5 transition-all duration-300",
                      isDarkTheme ? "bg-paper/70" : "bg-ink/70"
                    )}
                  />
                </span>
              </button>

              <button
                type="button"
                aria-label={`Bag (${mounted ? count : 0} items)`}
                aria-expanded={cartOpen}
                className={cn(iconBtn, "lg:hidden")}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="size-[17px]" strokeWidth={1.25} />
                {mounted && count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold bg-gold text-ink shadow-sm ring-2 ring-paper/20">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
                {TOP_NAV.map(({ key, label, href }) => {
                  const isActive = panel === key;
                  return (
                    <Link
                      key={key}
                      href={href}
                      prefetch={true}
                      onMouseEnter={() => handleMouseEnter(key)}
                      onFocus={() => handleMouseEnter(key)}
                      onClick={() => setPanel(null)}
                      aria-expanded={isActive}
                      className={cn(
                        "group relative py-2.5 text-[11px] font-medium uppercase tracking-[0.22em] transition-all duration-300 ease-out cursor-pointer",
                        isActive
                          ? "text-gold-light font-semibold"
                          : isDarkTheme
                          ? "text-paper/80 hover:text-gold-light"
                          : "text-ink/75 hover:text-gold-dark"
                      )}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          "absolute bottom-0.5 left-0 right-0 h-[1.5px] origin-center bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          isActive
                            ? "scale-x-100 opacity-100"
                            : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Center Logo */}
            <div className="flex justify-center text-center">
              <Link
                href="/"
                prefetch={true}
                onClick={handleLogoClick}
                className={cn(
                  "font-display text-base sm:text-lg lg:text-[1.35rem] leading-none tracking-[0.28em] sm:tracking-[0.34em] transition-all duration-300 truncate max-w-[190px] sm:max-w-none cursor-pointer",
                  isDarkTheme
                    ? "text-paper hover:text-gold-light"
                    : "text-ink hover:text-gold-dark"
                )}
                aria-label={`${BRAND_CONFIG.brandName} — home`}
              >
                {BRAND_CONFIG.brandName}
              </Link>
            </div>

            {/* Right Icons */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
              <button
                type="button"
                aria-label="Search"
                className={iconBtn}
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-[17px] sm:size-[18px]" strokeWidth={1.25} />
              </button>

              {/* Language Toggle */}
              <div ref={langContainerRef} className="relative hidden sm:flex items-center">
                <div
                  className={cn(
                    "flex items-center transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
                    langExpanded
                      ? cn(
                          "border px-3 py-1 gap-2 rounded-full shadow-sm",
                          isDarkTheme
                            ? "border-gold/40 bg-gold/10 text-gold-light backdrop-blur-md"
                            : "border-gold/40 bg-gold/10 text-ink"
                        )
                      : "border-transparent w-9 justify-center"
                  )}
                >
                  <button
                    type="button"
                    aria-label="Switch Language"
                    onClick={() => setLangExpanded(!langExpanded)}
                    className="p-1 cursor-pointer transition-colors hover:text-gold-light"
                  >
                    <Globe className="size-[17px] sm:size-[18px]" strokeWidth={1.25} />
                  </button>

                  {langExpanded && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider animate-in fade-in slide-in-from-right-2 duration-300">
                      <button
                        type="button"
                        onClick={() => {
                          setLangExpanded(false);
                          changeLanguage("en");
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded-xs cursor-pointer transition-all",
                          currentLang === "en"
                            ? "font-bold text-gold underline underline-offset-2"
                            : "opacity-55 hover:opacity-100"
                        )}
                      >
                        EN
                      </button>
                      <span className="opacity-30">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLangExpanded(false);
                          changeLanguage("bn");
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded-xs cursor-pointer transition-all",
                          currentLang === "bn"
                            ? "font-bold text-gold underline underline-offset-2"
                            : "opacity-55 hover:opacity-100"
                        )}
                      >
                        BN
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label={`Bag (${mounted ? count : 0} items)`}
                className={cn(iconBtn, "hidden lg:flex")}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="size-[18px]" strokeWidth={1.25} />
                {mounted && count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold bg-gold text-ink shadow-sm ring-2 ring-paper/30">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>

              <Link href="/account" prefetch={true} aria-label="Account" className={iconBtn}>
                <User className="size-[17px] sm:size-[18px]" strokeWidth={1.25} />
              </Link>
            </div>
          </div>

          {/* ——— MEGA DROPDOWN PANELS ——— */}
          <div className="relative w-full">
            {TOP_NAV.map(({ key }) => {
              const isActive = panel === key;
              const pData = PANELS[key];
              if (!pData) return null;

              return (
                <div
                  key={key}
                  ref={(el) => {
                    if (el && el.offsetHeight > 0) {
                      const h = el.offsetHeight;
                      setPanelHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
                    }
                  }}
                  className={cn(
                    "w-full transition-opacity duration-300",
                    isActive
                      ? "opacity-100 pointer-events-auto relative"
                      : "opacity-0 pointer-events-none absolute top-0 left-0"
                  )}
                >
                  <div className="container-x py-9">
                    {pData.featured ? (
                      <div className="grid grid-cols-12 gap-10 items-start">
                        <div className="col-span-8 grid grid-cols-3 gap-10">
                          {pData.columns.map((col: any) => (
                            <div key={col.heading} className="space-y-4">
                              <div className="inline-flex items-center gap-2.5 pb-1.5 border-b border-white/15 w-fit">
                                <span className="size-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(197,168,128,0.5)]" />
                                <p className="text-[10px] uppercase tracking-[0.26em] text-gold-light font-semibold font-mono">
                                  {col.heading}
                                </p>
                              </div>
                              <ul className="flex flex-col gap-2.5">
                                {col.links.map((l: any) => (
                                  <li key={l.href + l.label}>
                                    <Link
                                      href={l.href}
                                      prefetch={true}
                                      className="group/link inline-flex items-center text-[12px] uppercase tracking-[0.16em] text-paper/70 hover:text-gold-light transition-all duration-300 ease-out hover:translate-x-1.5"
                                      onClick={() => setPanel(null)}
                                    >
                                      <span className="relative">
                                        {l.label}
                                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold/60 transition-all duration-300 group-hover/link:w-full" />
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        <div className="col-span-4 flex justify-end">
                          <Link
                            href={pData.featured.href}
                            prefetch={true}
                            onClick={() => setPanel(null)}
                            className="group block w-full max-w-[220px] overflow-hidden"
                          >
                            <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/5 border border-white/10 shadow-xl">
                              <div
                                className="size-full bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                                style={{ backgroundImage: `url(${pData.featured.image})` }}
                                role="img"
                                aria-label={pData.featured.title}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </div>
                            <div className="mt-3 space-y-1">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-paper font-medium group-hover:text-gold-light transition-colors duration-300">
                                {pData.featured.title}
                              </p>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-paper/40 font-mono">
                                {pData.featured.subtitle}
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <div
                          className={cn(
                            "grid items-start",
                            pData.columns.length === 3
                              ? "grid-cols-3 gap-16 sm:gap-20 lg:gap-24 max-w-4xl"
                              : "grid-cols-2 gap-20 sm:gap-24 lg:gap-28 max-w-2xl"
                          )}
                        >
                          {pData.columns.map((col: any) => (
                            <div key={col.heading} className="space-y-4">
                              <div className="inline-flex items-center gap-2.5 pb-1.5 border-b border-white/15 w-fit">
                                <span className="size-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(197,168,128,0.5)]" />
                                <p className="text-[10px] uppercase tracking-[0.26em] text-gold-light font-semibold font-mono">
                                  {col.heading}
                                </p>
                              </div>
                              <ul className="flex flex-col gap-2.5">
                                {col.links.map((l: any) => (
                                  <li key={l.href + l.label}>
                                    <Link
                                      href={l.href}
                                      prefetch={true}
                                      className="group/link inline-flex items-center text-[12px] uppercase tracking-[0.16em] text-paper/70 hover:text-gold-light transition-all duration-300 ease-out hover:translate-x-1.5"
                                      onClick={() => setPanel(null)}
                                    >
                                      <span className="relative">
                                        {l.label}
                                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold/60 transition-all duration-300 group-hover/link:w-full" />
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>
      <MobileMenu />
    </>
  );
}
// END OF FILE src/components/layout/header.tsx
