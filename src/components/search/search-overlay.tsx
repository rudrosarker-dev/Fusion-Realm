// START OF FILE src/components/search/search-overlay.tsx
"use client";

import { ArrowRight, Clock, Search, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS } from "@/lib/data/products";
import { useUI } from "@/lib/store";
import { cn, LS_KEYS, readLS, writeLS } from "@/lib/utils";
import { Price } from "@/components/ui/primitives";
import type { Product } from "@/lib/types";

const POPULAR = ["Hoodie", "Trouser", "Knit", "Coat", "Denim", "Core Collection"];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, currency } = useUI();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live Database Products State (Instant Seed fallback + Live Neon DB Sync)
  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS);

  // Sync live database catalog whenever search overlay opens
  useEffect(() => {
    if (searchOpen) {
      setRecent(readLS<string[]>(LS_KEYS.searches, []));
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 120);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Fetch live products from Neon PostgreSQL without cache
      fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.products && data.products.length > 0) {
            setCatalog(data.products);
          }
        })
        .catch((err) => console.error("Live search catalog sync fallback:", err));

      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    setRecent(next);
    writeLS(LS_KEYS.searches, next);
  };

  const go = (term: string) => {
    saveRecent(term);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  // Instant Live Search Engine across Neon Database catalog
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { products: [], suggestions: [] };

    const matched = catalog.filter((p) => {
      const nameMatch = (p.name || "").toLowerCase().includes(q);
      const catMatch = (p.category || "").toLowerCase().includes(q);
      const descMatch = (p.description || "").toLowerCase().includes(q);
      const matMatch = (p.material || "").toLowerCase().includes(q);
      const colMatch = (p.collection || "").toLowerCase().includes(q);
      const colorMatch = p.colors?.some((c) => c.name.toLowerCase().includes(q));
      return nameMatch || catMatch || descMatch || matMatch || colMatch || colorMatch;
    });

    // Dynamic smart category suggestions
    const suggestions = Array.from(
      new Set(
        matched
          .map((p) => p.category)
          .concat(matched.map((p) => p.collection || ""))
          .filter((s) => Boolean(s) && s.toLowerCase().includes(q))
      )
    ).slice(0, 4);

    return { products: matched, suggestions };
  }, [catalog, query]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[110] flex flex-col bg-paper transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        searchOpen ? "visible opacity-100" : "invisible -translate-y-2 opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="border-b border-line/60 bg-paper">
        <div className="container-x flex h-14 sm:h-16 items-center gap-3 sm:gap-4">
          <Search className="size-4 sm:size-5 shrink-0 text-fog" strokeWidth={1.25} />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go(query);
            }}
            placeholder="Search products or categories..."
            aria-label="Search products"
            className="h-full flex-1 min-w-0 bg-transparent text-sm sm:text-base font-light text-ink placeholder:text-fog/70 border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 [-webkit-appearance:none] appearance-none"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink/70 hover:text-ink hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
          >
            <X className="size-4 sm:size-5" strokeWidth={1.25} />
          </button>
        </div>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto overscroll-contain">
        <div className="container-x py-6 sm:py-8">
          {query.trim().length < 2 ? (
            <div className="grid gap-8 sm:gap-10 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-3 sm:mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-[#9e7f55]">
                  <Clock className="size-3" strokeWidth={1.5} /> Recent Searches
                </p>
                {recent.length ? (
                  <ul className="flex flex-col gap-2">
                    {recent.map((r) => (
                      <li key={r}>
                        <button
                          onClick={() => go(r)}
                          className="text-xs sm:text-sm text-ash transition-colors hover:text-ink cursor-pointer"
                        >
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-fog">Your recent searches will appear here.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3 sm:mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-[#9e7f55]">
                  <TrendingUp className="size-3" strokeWidth={1.5} /> Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((p) => (
                    <button
                      key={p}
                      onClick={() => go(p)}
                      className="rounded-xs border border-line bg-paper px-3 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-ash transition-all duration-300 hover:border-ink hover:text-ink hover:bg-black/5 cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {results.suggestions.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="eyebrow mr-2 font-mono text-[10px] tracking-[0.22em] text-[#9e7f55]">Suggestions</span>
                  {results.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => go(s)}
                      className="rounded-xs border border-line px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-ash transition-all duration-300 hover:border-ink hover:text-ink hover:bg-black/5 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 ? (
                <>
                  <p className="eyebrow mb-4 font-mono text-[10px] tracking-[0.22em] text-[#9e7f55]">
                    Products ({results.products.length})
                  </p>
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {results.products.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={() => {
                            saveRecent(query);
                            setSearchOpen(false);
                          }}
                          className="group block"
                        >
                          <div className="relative aspect-[3/4] overflow-hidden bg-cream border border-line rounded-xs">
                            <Image
                              src={p.images?.[0]?.src || "/images/product-tee.jpg"}
                              alt={p.images?.[0]?.alt || p.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                          <div className="pt-2.5">
                            <p className="text-[12px] sm:text-[13px] font-medium leading-snug line-clamp-1">{p.name}</p>
                            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-fog font-mono">{p.category}</p>
                            <Price amountBDT={p.priceBDT} className="mt-1 text-[12px] sm:text-[13px]" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => go(query)}
                    className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] underline-offset-4 hover:underline text-ink cursor-pointer"
                  >
                    View all results for “{query}” <ArrowRight className="size-3.5" strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <div className="py-14 text-center">
                  <p className="font-display text-2xl font-light">No results for “{query}”</p>
                  <p className="mt-2 text-xs sm:text-sm text-ash max-w-sm mx-auto">
                    Try a broader term — or browse{" "}
                    <Link href="/shop" onClick={() => setSearchOpen(false)} className="underline underline-offset-4 text-ink font-medium">
                      all products
                    </Link>
                    .
                  </p>
                  <p className="mt-2 text-[11px] text-fog font-mono">Prices shown in {currency}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// END OF FILE src/components/search/search-overlay.tsx
