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
      <div className="border-b border-line">
        <div className="container-x flex h-16 items-center gap-4">
          <Search className="size-5 shrink-0 text-fog" strokeWidth={1.25} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go(query);
            }}
            placeholder="Search products, categories, collections"
            aria-label="Search products"
            className="h-full flex-1 bg-transparent text-lg outline-none placeholder:text-fog [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="flex size-9 items-center justify-center transition-colors hover:bg-cream"
          >
            <X className="size-5" strokeWidth={1.25} />
          </button>
        </div>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto">
        <div className="container-x py-8">
          {query.trim().length < 2 ? (
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-4 flex items-center gap-2">
                  <Clock className="size-3.5" strokeWidth={1.5} /> Recent Searches
                </p>
                {recent.length ? (
                  <ul className="flex flex-col gap-2.5">
                    {recent.map((r) => (
                      <li key={r}>
                        <button onClick={() => go(r)} className="text-sm text-ash transition-colors hover:text-ink">
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-fog">Your recent searches will appear here.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-4 flex items-center gap-2">
                  <TrendingUp className="size-3.5" strokeWidth={1.5} /> Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((p) => (
                    <button
                      key={p}
                      onClick={() => go(p)}
                      className="border border-line px-4 py-2 text-xs uppercase tracking-[0.12em] text-ash transition-colors hover:border-ink hover:text-ink"
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
                  <span className="eyebrow mr-2">Suggestions</span>
                  {results.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => go(s)}
                      className="border border-line px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] text-ash transition-colors hover:border-ink hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 ? (
                <>
                  <p className="eyebrow mb-4">Products ({results.products.length})</p>
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
                          <div className="relative aspect-[3/4] overflow-hidden bg-cream border border-line">
                            <Image
                              src={p.images?.[0]?.src || "/images/product-tee.jpg"}
                              alt={p.images?.[0]?.alt || p.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                          <div className="pt-3">
                            <p className="text-[13px] font-medium">{p.name}</p>
                            <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-fog">{p.category}</p>
                            <Price amountBDT={p.priceBDT} className="mt-1 text-[13px]" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => go(query)}
                    className="mt-8 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] underline-offset-4 hover:underline"
                  >
                    View all results for “{query}” <ArrowRight className="size-3.5" strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <div className="py-14 text-center">
                  <p className="font-display text-2xl">No results for “{query}”</p>
                  <p className="mt-2 text-sm text-ash">
                    Try a broader term — or browse{" "}
                    <Link href="/shop" onClick={() => setSearchOpen(false)} className="underline underline-offset-4">
                      all products
                    </Link>
                    .
                  </p>
                  <p className="mt-1 text-xs text-fog">Prices shown in {currency}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
