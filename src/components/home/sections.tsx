// START OF FILE src/components/home/sections.tsx
"use client";

import { ArrowDown, ArrowRight, Star, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/layout/footer";
import { Reveal } from "@/components/ui/overlays";
import { Price } from "@/components/ui/primitives";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { DraggableCarousel } from "./draggable-carousel";
import type { Product } from "@/lib/types";

interface BannersConfig {
  hero: string;
  collection: string;
  men: string;
  women: string;
  story: string;
}

const DEFAULT_BANNERS: BannersConfig = {
  hero: "/images/hero.jpg",
  collection: "/images/collection.jpg",
  men: "/images/category-men.jpg",
  women: "/images/category-women.jpg",
  story: "/images/story.jpg",
};

/* ————————————————— SECTION 1 — HERO ————————————————— */
export function Hero({ banner = DEFAULT_BANNERS.hero, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.heroEyebrow || "Winter Edit — 2026";
  const heading = content?.heroHeading || "Quiet warmth.\nLasting form.";
  const body =
    content?.heroBody ||
    "Considered layers, tactile knits and outerwear for the colder days. Made to move with you, season after season.";

  return (
    <section className="relative -mt-16 flex min-h-[100svh] items-end overflow-hidden pt-16 group" aria-label="New season hero">
      <div className="absolute inset-0 origin-center transition-transform duration-1000 ease-out">
        <Image src={banner || DEFAULT_BANNERS.hero} alt={`${BRAND_CONFIG.brandName} Campaign Shoot`} fill priority sizes="100vw" className="object-cover" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent opacity-95" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent opacity-75" aria-hidden />

      <div className="container-x relative z-10 pb-20 pt-24 text-paper sm:pb-32 sm:pt-36">
        {eyebrow && (
          <Reveal>
            <p className="eyebrow !text-gold-light font-mono font-medium tracking-[0.28em] drop-shadow-sm">{eyebrow}</p>
          </Reveal>
        )}
        {heading && (
          <Reveal delay={100}>
            <h1 className="mt-4 max-w-5xl font-display text-[13vw] leading-[0.92] tracking-tight sm:text-[9vw] lg:text-[6.8rem] font-normal text-paper whitespace-pre-line text-balance drop-shadow-md">
              {heading}
            </h1>
          </Reveal>
        )}
        {body && (
          <Reveal delay={180}>
            <p className="mt-6 max-w-md text-[14px] leading-[1.8] text-paper/85 sm:text-[16px] font-light whitespace-pre-line">
              {body}
            </p>
          </Reveal>
        )}
        <Reveal delay={260}>
          <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-5">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center h-12 px-8 text-xs uppercase tracking-[0.2em] font-semibold text-ink bg-paper border border-white hover:bg-gold-light hover:text-ink transition-all duration-300 shadow-lg cursor-pointer rounded-xs"
            >
              Explore Collection
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center h-12 px-7 text-xs uppercase tracking-[0.2em] font-medium text-paper border border-white/30 bg-black/20 backdrop-blur-sm hover:border-gold hover:text-gold-light transition-all duration-300 cursor-pointer rounded-xs"
            >
              The Atelier Story
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="absolute bottom-8 right-8 z-10 hidden items-center gap-3 text-paper/60 sm:flex font-mono" aria-hidden>
        <ArrowDown className="size-3.5 text-gold-light animate-bounce" strokeWidth={1.5} />
        <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
      </div>
    </section>
  );
}

/* ————————————————— VALUE MARQUEE (BULLETPROOF SAFE) ————————————————— */
export function ValueMarquee({ itemsString }: { itemsString?: string }) {
  // নিশ্চিত করা হচ্ছে যে কোনো অবস্থাতেই ক্র্যাশ হবে না
  const rawList = typeof itemsString === "string" && itemsString.trim().length > 0 
    ? itemsString.split("|") 
    : (BRAND_CONFIG.marqueeItems || [
        "Dhaka Atelier Hand-Finished",
        "Numbered Micro Runs",
        "Heavyweight Japanese Twill",
        "Garment Washed Character",
        "Complimentary Delivery Over ৳15,000",
      ]);

  const items = rawList.map((s) => String(s).trim()).filter(Boolean);

  return (
    <div className="border-b border-line/50 bg-paper py-4 sm:py-5 overflow-hidden">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-center sm:gap-x-10">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-6 sm:gap-10">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-ink/75 font-semibold font-mono">
              {item}
            </span>
            {index < items.length - 1 && <span className="hidden size-1 rounded-full bg-gold-dark/40 sm:inline-block" aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ————————————————— SECTION 2 — FEATURED COLLECTION ————————————————— */
export function FeaturedCollection({ banner = DEFAULT_BANNERS.collection, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.featuredEyebrow || "Featured Collection";
  const heading = content?.featuredHeading || "The New\nCollection";
  const body =
    content?.featuredBody ||
    "Carefully developed pieces crafted in luxury cloth — slower construction, nothing decorative. Built to sit alongside every garment you already own.";

  return (
    <section className="container-x py-24 lg:py-36" aria-label="The new collection">
      <div className="grid items-center gap-12 lg:gap-20 lg:grid-cols-12">
        <Reveal className="lg:col-span-7" direction="left">
          <Link href="/collections/new-season" className="group relative block overflow-hidden bg-cream/40 border border-line/60 shadow-sm rounded-xs">
            <div className="relative aspect-[4/5] sm:aspect-[16/11]">
              <Image src={banner || DEFAULT_BANNERS.collection} alt={`Featured Collection — ${BRAND_CONFIG.brandName}`} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            </div>
          </Link>
        </Reveal>
        <div className="lg:col-span-5 lg:pl-4">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow !text-gold-dark font-mono font-semibold tracking-[0.25em]">{eyebrow}</p>
            </Reveal>
          )}
          {heading && (
            <Reveal delay={100}>
              <h2 className="mt-4 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl font-medium text-ink whitespace-pre-line tracking-tight">
                {heading}
              </h2>
            </Reveal>
          )}
          {body && (
            <Reveal delay={180}>
              <p className="mt-6 max-w-sm text-[14px] leading-[1.8] text-ash font-light whitespace-pre-line">{body}</p>
            </Reveal>
          )}
          <Reveal delay={260}>
            <Link
              href="/collections/new-season"
              className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink hover:text-gold-dark transition-colors pb-1 border-b border-ink/30 hover:border-gold-dark"
            >
              <span>Explore Collection</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 3 — SELECTED PIECES ————————————————— */
export function SelectedPieces({ products = [] }: { products?: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-cream/25 border-y border-line/50 py-24 lg:py-32" aria-label="Selected pieces">
      <div className="container-x">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-line/50 pb-6">
          <Reveal>
            <div>
              <p className="eyebrow !text-gold-dark font-mono font-semibold tracking-[0.25em]">Curated Archive</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-normal text-ink">Selected Silhouettes</h2>
            </div>
          </Reveal>
          <Reveal delay={100} className="sm:pr-24">
            <Link href="/shop" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink hover:text-gold-dark transition-colors flex items-center gap-1.5">
              <span>View All Pieces</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Reveal>
        </div>
        <DraggableCarousel products={products} />
      </div>
    </section>
  );
}

/* ————————————————— SECTION 4 — CATEGORY SPLIT ————————————————— */
export function CategorySplit({ menBanner = DEFAULT_BANNERS.men, womenBanner = DEFAULT_BANNERS.women }: { menBanner?: string; womenBanner?: string }) {
  const cats = [
    { title: "Men", href: "/shop?gender=men", image: menBanner || DEFAULT_BANNERS.men, alt: "Menswear collection" },
    { title: "Women", href: "/shop?gender=women", image: womenBanner || DEFAULT_BANNERS.women, alt: "Womenswear collection" },
  ];
  return (
    <section aria-label="Shop by category" className="grid md:grid-cols-2">
      {cats.map((c) => (
        <Link key={c.title} href={c.href} className="group relative block overflow-hidden">
          <div className="relative aspect-[4/5] md:aspect-[3/4]">
            <Image src={c.image} alt={c.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent transition-opacity duration-500 group-hover:opacity-90" aria-hidden />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 sm:p-14 text-paper">
            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">{c.title}</h3>
            <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-gold-light">
              Explore {c.title} <ArrowRight className="size-3.5" />
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}

/* ————————————————— SECTION 5 — BRAND STORY ————————————————— */
export function Story({ banner = DEFAULT_BANNERS.story, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.storyEyebrow || "Design Philosophy";
  const heading = content?.storyHeading || "Designed for movement.\nBuilt with intention.";
  const body =
    content?.storyBody ||
    `${BRAND_CONFIG.brandName} began with a simple fatigue: closets full of clothes, nothing worth wearing. We make the opposite — a narrow line of garments in heavyweight natural cloth, cut generously and finished slowly.`;

  return (
    <section className="bg-ink text-paper" aria-label="The brand philosophy">
      <div className="container-x grid gap-14 py-24 lg:grid-cols-2 lg:gap-20 lg:py-36 items-center">
        <div className="flex flex-col justify-center">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow !text-gold font-mono font-semibold tracking-[0.25em]">{eyebrow}</p>
            </Reveal>
          )}
          {heading && (
            <Reveal delay={100}>
              <h2 className="mt-5 font-display text-4xl leading-[1.12] sm:text-5xl font-light whitespace-pre-line text-balance tracking-tight">
                {heading}
              </h2>
            </Reveal>
          )}
          {body && (
            <Reveal delay={180}>
              <div className="mt-8 max-w-md text-[14px] leading-[1.8] text-paper/75 font-light whitespace-pre-line">
                <p>{body}</p>
              </div>
            </Reveal>
          )}
          <Reveal delay={260}>
            <div className="mt-10">
              <Link
                href="/about"
                className="inline-flex items-center justify-center h-12 px-8 text-xs uppercase tracking-[0.2em] font-semibold text-ink bg-paper hover:bg-gold-light transition-all duration-300 rounded-xs cursor-pointer"
              >
                Our Story
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal className="relative min-h-[380px] lg:min-h-0" direction="left">
          <div className="relative h-full min-h-[400px] overflow-hidden border border-paper/15 shadow-xl rounded-xs">
            <Image src={banner || DEFAULT_BANNERS.story} alt="Textile detail" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 6 — COLLECTION FEATURE ————————————————— */
export function CollectionFeature({ banner = DEFAULT_BANNERS.hero, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.coreEyebrow || "Permanent Line";
  const heading = content?.coreHeading || "Core 01";
  const body =
    content?.coreBody ||
    "The permanent wardrobe. Seasonless silhouettes in natural tones — restocked continuously, never discounted into noise.";

  return (
    <section className="container-x py-24 lg:py-36" aria-label="Core collection">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-4">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow !text-gold-dark font-mono font-semibold tracking-[0.25em]">{eyebrow}</p>
            </Reveal>
          )}
          {heading && (
            <Reveal delay={100}>
              <h2 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl font-light text-ink whitespace-pre-line">
                {heading}
              </h2>
            </Reveal>
          )}
          {body && (
            <Reveal delay={180}>
              <p className="mt-6 max-w-sm text-[14px] leading-[1.8] text-ash font-light whitespace-pre-line">{body}</p>
            </Reveal>
          )}
          <Reveal delay={260}>
            <div className="mt-8">
              <Link
                href="/collections/core"
                className="inline-flex items-center justify-center h-12 px-7 text-xs uppercase tracking-[0.2em] font-semibold text-ink border border-ink hover:bg-ink hover:text-paper transition-all duration-300 rounded-xs"
              >
                View Core Collection
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal className="order-1 lg:order-2 lg:col-span-8" direction="left">
          <Link href="/collections/core" className="group relative block overflow-hidden bg-cream/40 border border-line/60 rounded-xs shadow-sm">
            <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[16/10]">
              <Image src={banner || DEFAULT_BANNERS.hero} alt="Core collection" fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 7 — PRODUCT HIGHLIGHT ————————————————— */
export function ProductHighlight({ product }: { product?: Product | null }) {
  if (!product) return null;

  return (
    <section className="bg-cream/20 border-t border-line/50 py-24 lg:py-32" aria-label="Featured product">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative" direction="left">
          <Link href={`/products/${product.slug}`} className="group relative block overflow-hidden border border-line/50 bg-paper rounded-xs shadow-md">
            <div className="relative aspect-[4/5]">
              <Image src={product.images?.[0]?.src || "/images/product-hoodie.jpg"} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            </div>
          </Link>
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow !text-gold-dark font-mono font-semibold tracking-[0.25em]">Piece of the Season</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-light text-ink text-balance">{product.name}</h2>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-4 flex items-center gap-4">
              <Price amountBDT={product.priceBDT} className="text-2xl font-semibold text-ink" />
              <span className="flex items-center gap-1.5 text-[10px] text-ink/70 font-mono tracking-wider bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                <Star className="size-3 fill-gold text-gold" /> {product.rating || 5.0} ({product.reviews || 0} Reviews)
              </span>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 max-w-md text-[14px] leading-[1.8] text-ash font-light">{product.description || product.shortDescription}</p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center justify-center h-12 px-8 text-xs uppercase tracking-[0.2em] font-semibold text-paper bg-ink hover:bg-gold-dark transition-all duration-300 rounded-xs shadow-sm"
              >
                Shop Now
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center h-12 px-7 text-xs uppercase tracking-[0.2em] font-medium text-ink border border-line hover:border-ink transition-all duration-300 rounded-xs"
              >
                View All Pieces
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 8 — NEWSLETTER ————————————————— */
export function NewsletterSection({ content }: { content?: any }) {
  const eyebrow = content?.newsletterEyebrow || "Atelier Dispatch";
  const heading = content?.newsletterHeading || "Stay in Form";
  const body =
    content?.newsletterBody ||
    "New pieces, private restocks and studio notes. Strictly one letter a month — never more, always worth opening.";

  return (
    <section className="container-x py-24 lg:py-36" aria-label="Newsletter">
      <Reveal className="mx-auto max-w-3xl border border-line/60 bg-paper p-8 sm:p-16 text-center rounded-xs shadow-sm">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-gold-dark mb-5 rounded-xs">
            <Sparkles className="size-3" />
            <span className="font-semibold">{eyebrow}</span>
          </div>
        )}
        {heading && <h2 className="mt-2 font-display text-4xl sm:text-5xl font-light text-ink tracking-tight">{heading}</h2>}
        {body && <p className="mt-5 text-[14px] leading-[1.8] text-ash max-w-md mx-auto font-light whitespace-pre-line">{body}</p>}
        <div className="mt-10 w-full max-w-md mx-auto">
          <NewsletterForm />
        </div>
      </Reveal>
    </section>
  );
}
// END OF FILE src/components/home/sections.tsx
