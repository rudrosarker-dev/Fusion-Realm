// START OF FILE src/components/shop/shop-client.tsx
"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Drawer } from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/primitives";
import { ALL_CATEGORIES, PRICE_MAX, PRICE_MIN } from "@/lib/data/products";
import { getCollection } from "@/lib/data/collections";
import { cn, formatPrice, isSoldOut, onSale } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { Product } from "@/lib/types";

export interface ShopQuery {
  gender?: string;
  category?: string;
  collection?: string;
  filter?: string;
}

export interface ShopClientProps {
  initial?: ShopQuery;
  serverProducts?: Product[];
  shopContent?: {
    eyebrow?: string;
    heading?: string;
    description?: string;
    badgeLabel?: string;
  };
}

type SortKey = "featured" | "newest" | "best" | "price-asc" | "price-desc" | "alpha";

const SORTS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "Newest",
  best: "Best Selling",
  "price-asc": "Price — Low to High",
  "price-desc": "Price — High to Low",
  alpha: "Alphabetical",
};

const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLLECTIONS_LIST = [
  { value: "core", label: "Core Collection" },
  { value: "essentials", label: "Essentials" },
  { value: "studio", label: "Studio Collection" },
  { value: "limited", label: "Limited Edition" },
];
const COLOR_FACETS = [
  { name: "Bone", hex: "#e8e3d7" },
  { name: "Black", hex: "#171614" },
  { name: "Charcoal", hex: "#37352f" },
  { name: "Oat", hex: "#d6cbb6" },
  { name: "Stone", hex: "#b1aa9c" },
  { name: "Ink", hex: "#23262e" },
  { name: "Ash", hex: "#8e897d" },
];

interface Filters {
  genders: string[];
  categories: string[];
  collections: string[];
  sizes: string[];
  colors: string[];
  availability: string[];
  maxPrice: number;
  onlyNew: boolean;
  onlyBest: boolean;
  onSale: boolean;
}

function matches(p: Product, f: Filters, catalogMaxPrice: number): boolean {
  if (f.genders.length && !f.genders.includes(p.gender)) return false;
  if (f.categories.length && !f.categories.includes(p.category)) return false;
  if (f.collections.length && !f.collections.includes(p.collection)) return false;
  if (f.sizes.length && !p.sizes?.some((v) => f.sizes.includes(v.size) && v.stock > 0)) return false;
  if (f.colors.length && !p.colors?.some((c) => f.colors.includes(c.name))) return false;
  if (f.availability.length) {
    const sold = isSoldOut(p);
    if (sold && !f.availability.includes("out")) return false;
    if (!sold && !f.availability.includes("in")) return false;
  }
  if (f.maxPrice < catalogMaxPrice && p.priceBDT > f.maxPrice) return false;
  if (f.onlyNew && !p.newArrival) return false;
  if (f.onlyBest && !p.bestSeller) return false;
  if (f.onSale && !onSale(p)) return false;
  return true;
}

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const arr = [...list];
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    case "best":
      return arr.sort((a, b) => Number(b.bestSeller ?? false) - Number(a.bestSeller ?? false));
    case "price-asc":
      return arr.sort((a, b) => a.priceBDT - b.priceBDT);
    case "price-desc":
      return arr.sort((a, b) => b.priceBDT - a.priceBDT);
    case "alpha":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return arr.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
  }
}

function FilterPanel({
  filters,
  setFilters,
  maxLimit,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  maxLimit: number;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    price: true,
    category: true,
    gender: true,
    availability: false,
    size: false,
    color: false,
    collection: false,
    highlights: false,
  });

  const toggle = (key: string) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleArr = (key: "genders" | "categories" | "collections" | "sizes" | "colors" | "availability", val: string) => {
    const cur = filters[key];
    setFilters({ ...filters, [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  };

  const groupCls = "border-b border-line";
  
  // লেখা সম্পূর্ণ স্থির থাকবে (No shifting), কিন্তু মাউস নিলে চমৎকার উজ্জ্বল সোনালী রঙে জ্বলে উঠবে
  const checkCls = (active: boolean) =>
    cn(
      "group flex cursor-pointer items-center gap-3 text-xs transition-colors duration-150 select-none py-0.5",
      active ? "font-semibold text-[#a68352]" : "text-ash hover:text-[#a68352]"
    );

  const boxCls = (on: boolean) =>
    cn(
      "flex size-4 items-center justify-center border transition-all rounded-2xs shrink-0",
      on
        ? "border-[#a68352] bg-[#a68352] text-paper shadow-2xs"
        : "border-line bg-paper/80 group-hover:border-[#a68352]"
    );

  const Header = ({ title, count, sectionKey }: { title: string; count?: number; sectionKey: string }) => (
    <button
      type="button"
      onClick={() => toggle(sectionKey)}
      className="flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-ink hover:text-[#a68352] transition-colors cursor-pointer select-none"
    >
      <span className="flex items-center gap-1.5">
        {title}
        {count && count > 0 ? <span className="text-[10px] text-[#a68352] font-mono font-bold">({count})</span> : null}
      </span>
      <ChevronDown
        className={cn(
          "size-3.5 text-fog transition-transform duration-300",
          open[sectionKey] ? "rotate-180 text-ink" : "rotate-0"
        )}
      />
    </button>
  );

  return (
    <div className="divide-y divide-line">
      <div className={groupCls}>
        <Header title="Max Price" sectionKey="price" />
        <div className={cn("overflow-hidden transition-all duration-300", open.price ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <p className="text-xs font-mono font-bold text-ink mb-2">{formatPrice(filters.maxPrice)}</p>
          <input
            type="range"
            min={PRICE_MIN}
            max={maxLimit}
            step={500}
            value={filters.maxPrice}
            aria-label="Maximum price"
            onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-full accent-[#a68352] cursor-pointer"
          />
          <div className="mt-1 flex justify-between text-[10px] text-fog font-mono">
            <span>{formatPrice(PRICE_MIN)}</span>
            <span>{formatPrice(maxLimit)}</span>
          </div>
        </div>
      </div>

      <div className={groupCls}>
        <Header title="Category" count={filters.categories.length} sectionKey="category" />
        <div className={cn("overflow-hidden transition-all duration-300", open.category ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto thin-scroll pr-1">
            {ALL_CATEGORIES.map((c) => {
              const isChecked = filters.categories.includes(c);
              return (
                <label key={c} className={checkCls(isChecked)}>
                  <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => toggleArr("categories", c)} />
                  <span className={boxCls(isChecked)}>
                    {isChecked && <span className="size-1.5 bg-paper rounded-full" />}
                  </span>
                  <span>{c}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className={groupCls}>
        <Header title="Gender" count={filters.genders.length} sectionKey="gender" />
        <div className={cn("overflow-hidden transition-all duration-300", open.gender ? "max-h-48 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <div className="flex flex-col gap-2">
            {GENDERS.map((g) => {
              const isChecked = filters.genders.includes(g.value);
              return (
                <label key={g.value} className={checkCls(isChecked)}>
                  <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => toggleArr("genders", g.value)} />
                  <span className={boxCls(isChecked)}>
                    {isChecked && <span className="size-1.5 bg-paper rounded-full" />}
                  </span>
                  <span>{g.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className={groupCls}>
        <Header title="Availability" count={filters.availability.length} sectionKey="availability" />
        <div className={cn("overflow-hidden transition-all duration-300", open.availability ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <div className="flex flex-col gap-2">
            {[
              { v: "in", l: "In Stock" },
              { v: "out", l: "Out of Stock" },
            ].map((o) => {
              const isChecked = filters.availability.includes(o.v);
              return (
                <label key={o.v} className={checkCls(isChecked)}>
                  <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => toggleArr("availability", o.v)} />
                  <span className={boxCls(isChecked)}>
                    {isChecked && <span className="size-1.5 bg-paper rounded-full" />}
                  </span>
                  <span>{o.l}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className={groupCls}>
        <Header title="Size" count={filters.sizes.length} sectionKey="size" />
        <div className={cn("overflow-hidden transition-all duration-300", open.size ? "max-h-48 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <div className="flex flex-wrap gap-2 pt-1">
            {APPAREL_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={filters.sizes.includes(s)}
                onClick={() => toggleArr("sizes", s)}
                className={cn(
                  "flex h-8 min-w-10 items-center justify-center border px-2 text-xs font-mono transition-all cursor-pointer rounded-xs",
                  filters.sizes.includes(s)
                    ? "border-[#a68352] bg-ink text-gold-light font-bold shadow-xs"
                    : "border-line bg-paper/60 hover:border-[#a68352] hover:text-[#a68352]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={groupCls}>
        <Header title="Colour" count={filters.colors.length} sectionKey="color" />
        <div className={cn("overflow-hidden transition-all duration-300", open.color ? "max-h-48 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {COLOR_FACETS.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-pressed={filters.colors.includes(c.name)}
                aria-label={`Filter by colour ${c.name}`}
                onClick={() => toggleArr("colors", c.name)}
                className={cn(
                  "flex size-7 items-center justify-center border transition-all cursor-pointer rounded-xs",
                  filters.colors.includes(c.name) ? "border-[#a68352] ring-1 ring-[#a68352]/40" : "border-transparent hover:border-line"
                )}
              >
                <span className="size-4.5 border border-ink/15" style={{ backgroundColor: c.hex }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={groupCls}>
        <Header title="Collection" count={filters.collections.length} sectionKey="collection" />
        <div className={cn("overflow-hidden transition-all duration-300", open.collection ? "max-h-60 pb-5 opacity-100" : "max-h-0 opacity-0")}>
          <div className="flex flex-col gap-2">
            {COLLECTIONS_LIST.map((c) => {
              const isChecked = filters.collections.includes(c.value);
              return (
                <label key={c.value} className={checkCls(isChecked)}>
                  <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => toggleArr("collections", c.value)} />
                  <span className={boxCls(isChecked)}>
                    {isChecked && <span className="size-1.5 bg-paper rounded-full" />}
                  </span>
                  <span>{c.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopClient({ initial, serverProducts, shopContent }: ShopClientProps) {
  const searchParams = useSearchParams();
  const genderQuery = searchParams.get("gender") || initial?.gender || undefined;
  const categoryQuery = searchParams.get("category") || initial?.category || undefined;
  const collectionQuery = searchParams.get("collection") || initial?.collection || undefined;
  const filterQuery = searchParams.get("filter") || initial?.filter || undefined;

  const catalog = serverProducts || [];

  const catalogMaxPrice = useMemo(() => {
    if (!catalog.length) return PRICE_MAX;
    return Math.max(...catalog.map((p) => p.priceBDT), PRICE_MAX);
  }, [catalog]);

  const [filters, setFilters] = useState<Filters>(() => ({
    genders: genderQuery ? [genderQuery] : [],
    categories: categoryQuery ? [categoryQuery] : [],
    collections: collectionQuery ? [collectionQuery] : [],
    sizes: [],
    colors: [],
    availability: [],
    maxPrice: catalogMaxPrice,
    onlyNew: filterQuery === "new",
    onlyBest: filterQuery === "best",
    onSale: false,
  }));

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      genders: genderQuery ? [genderQuery] : [],
      categories: categoryQuery ? [categoryQuery] : [],
      collections: collectionQuery ? [collectionQuery] : [],
      onlyNew: filterQuery === "new",
      onlyBest: filterQuery === "best",
    }));
  }, [genderQuery, categoryQuery, collectionQuery, filterQuery]);

  const [sort, setSort] = useState<SortKey>("featured");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount =
    filters.genders.length +
    filters.categories.length +
    filters.collections.length +
    filters.sizes.length +
    filters.colors.length +
    filters.availability.length +
    (filters.maxPrice < catalogMaxPrice ? 1 : 0) +
    Number(filters.onlyNew) +
    Number(filters.onlyBest) +
    Number(filters.onSale);

  const results = useMemo(
    () => sortProducts(catalog.filter((p) => matches(p, filters, catalogMaxPrice)), sort),
    [catalog, filters, sort, catalogMaxPrice]
  );

  const title = collectionQuery
    ? getCollection(collectionQuery)?.title ?? "Shop"
    : genderQuery === "men"
    ? "Men"
    : genderQuery === "women"
    ? "Women"
    : categoryQuery
    ? categoryQuery
    : filterQuery === "new"
    ? "New Arrivals"
    : filterQuery === "best"
    ? "Best Sellers"
    : shopContent?.heading ?? "All Products";

  const eyebrowText = shopContent?.eyebrow ?? `${BRAND_CONFIG.brandName} — SS26`;
  const descText =
    shopContent?.description ??
    "Quiet garments in heavyweight natural cloth. Filter by size, colour and collection to find your uniform.";
  const badgeSuffix = shopContent?.badgeLabel ?? "garments in atelier";

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <header className="mb-10 border-b border-line pb-8">
        {eyebrowText && <p className="eyebrow !text-[#a68352] font-mono">{eyebrowText}</p>}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">{title}</h1>
          
          {/* শপ পেজ কাউন্টার ব্যাজ */}
          <div className="px-3.5 py-1.5 border border-line bg-cream/80 rounded-xs shadow-2xs font-mono text-xs font-bold text-ink">
            {results.length} {results.length === 1 ? badgeSuffix.replace(/s\b/, "") : badgeSuffix}
          </div>
        </div>
        {descText && <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash">{descText}</p>}
      </header>

      <div className="flex gap-12">
        <aside className="sticky top-28 hidden h-fit max-h-[calc(100vh-8rem)] w-60 shrink-0 overflow-y-auto thin-scroll lg:block" aria-label="Filters">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">FILTERS</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    genders: [],
                    categories: [],
                    collections: [],
                    sizes: [],
                    colors: [],
                    availability: [],
                    maxPrice: catalogMaxPrice,
                    onlyNew: false,
                    onlyBest: false,
                    onSale: false,
                  })
                }
                className="text-[10px] text-fog uppercase tracking-wider underline-offset-2 hover:text-[#a68352] hover:underline cursor-pointer"
              >
                Clear all ({activeCount})
              </button>
            )}
          </div>
          <FilterPanel filters={filters} setFilters={setFilters} maxLimit={catalogMaxPrice} />
        </aside>

        <div className="flex-1">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 border border-line px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-gold lg:hidden cursor-pointer rounded-xs"
            >
              <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
              Filter {activeCount > 0 && <span className="text-[#a68352] font-bold">({activeCount})</span>}
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    genders: [],
                    categories: [],
                    collections: [],
                    sizes: [],
                    colors: [],
                    availability: [],
                    maxPrice: catalogMaxPrice,
                    onlyNew: false,
                    onlyBest: false,
                    onSale: false,
                  })
                }
                className="hidden items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-fog hover:text-[#a68352] lg:inline-flex cursor-pointer"
              >
                <X className="size-3" strokeWidth={1.5} /> {activeCount} active
              </button>
            )}
            <div className="relative ml-auto">
              <label htmlFor="sort" className="sr-only">
                Sort products
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-10 appearance-none border border-line bg-transparent pl-4 pr-10 text-[11px] font-medium uppercase tracking-[0.14em] outline-none transition-colors hover:border-gold cursor-pointer rounded-xs"
              >
                {Object.entries(SORTS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-fog" strokeWidth={1.5} />
            </div>
          </div>

          {results.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 6} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No garments in this section."
              copy="New garments added to your back office will appear here live."
              actionLabel="Explore Atelier"
              actionHref="/"
            />
          )}
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Filters ${activeCount ? `(${activeCount})` : ""}`} side="left">
        <div className="thin-scroll flex-1 overflow-y-auto px-5">
          <FilterPanel filters={filters} setFilters={setFilters} maxLimit={catalogMaxPrice} />
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
          <button
            type="button"
            onClick={() =>
              setFilters({
                genders: [],
                categories: [],
                collections: [],
                sizes: [],
                colors: [],
                availability: [],
                maxPrice: catalogMaxPrice,
                onlyNew: false,
                onlyBest: false,
                onSale: false,
              })
            }
            className="border border-line py-3 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-ink cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="bg-ink py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-paper cursor-pointer"
          >
            Show {results.length} Results
          </button>
        </div>
      </Drawer>
    </div>
  );
}
// END OF FILE src/components/shop/shop-client.tsx
