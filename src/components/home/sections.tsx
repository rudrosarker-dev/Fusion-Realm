// START OF FILE src/components/home/sections.tsx
"use client";

import { ArrowDown, ArrowRight, Star, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { NewsletterForm } from "@/components/layout/footer";
import { Reveal } from "@/components/ui/overlays";
import { Button, Price } from "@/components/ui/primitives";
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
  const eyebrow = content?.heroEyebrow !== undefined ? content.heroEyebrow : "Winter Edit — 2026";
  const heading = content?.heroHeading !== undefined ? content.heroHeading : "Quiet warmth.\nLasting form.";
  const body = content?.heroBody !== undefined ? content.heroBody : "Considered layers, tactile knits and outerwear for the colder days. Made to move with you, season after season.";

  return (
    <section className="relative -mt-16 flex min-h-[100svh] items-end overflow-hidden pt-16 group" aria-label="New season hero">
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 25, ease: "easeOut" }}
        className="absolute inset-0 origin-center"
      >
        <Image src={banner} alt={`${BRAND_CONFIG.brandName} Campaign Shoot`} fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent opacity-90" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent opacity-70" aria-hidden />

      <div className="container-x relative z-10 pb-24 pt-24 text-paper sm:pb-36 sm:pt-40">
        {eyebrow && (
          <Reveal>
            <p className="eyebrow !text-gold font-mono font-semibold tracking-[0.25em]">{eyebrow}</p>
          </Reveal>
        )}
        {heading && (
          <Reveal delay={120}>
            <h1 className="mt-5 max-w-5xl font-display text-[14vw] leading-[0.9] tracking-tight sm:text-[10vw] lg:text-[7.5rem] font-normal text-paper whitespace-pre-line text-balance drop-shadow-lg">
              {heading}
            </h1>
          </Reveal>
        )}
        {body && (
          <Reveal delay={240}>
            <p className="mt-8 max-w-md text-[15px] leading-[1.8] text-paper/80 sm:text-[17px] font-light whitespace-pre-line text-pretty">
              {body}
            </p>
          </Reveal>
        )}
        <Reveal delay={360}>
          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Button href="/shop" variant="inverse" size="lg">
              Explore Collection
            </Button>
            <Button href="/about" variant="ghost" size="lg" className="text-paper/90 hover:text-gold-light hover:decoration-gold/60">
              The Atelier Story
            </Button>
          </div>
        </Reveal>
      </div>

      <div className="absolute bottom-10 right-10 z-10 hidden items-center gap-4 text-paper/60 sm:flex font-mono" aria-hidden>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="size-4 text-gold-light" strokeWidth={1.5} />
        </motion.div>
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Scroll</span>
      </div>
    </section>
  );
}

/* ————————————————— VALUE MARQUEE ————————————————— */
export function ValueMarquee() {
  const items = [
    "Dhaka Atelier Hand-Finished",
    "Numbered Micro Runs",
    "Heavyweight Japanese Twill",
    "Garment Washed Character",
    "Complimentary Delivery over ৳15,000",
  ];
  return (
    <div className="border-b border-line/40 bg-paper py-5 sm:py-6">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center sm:gap-x-12">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-8 sm:gap-12">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-ink/70 font-semibold">{item}</span>
            {index < items.length - 1 && <span className="hidden size-1.5 rounded-full bg-gold/50 sm:inline-block" aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ————————————————— SECTION 2 — FEATURED COLLECTION ————————————————— */
export function FeaturedCollection({ banner = DEFAULT_BANNERS.collection, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.featuredEyebrow !== undefined ? content.featuredEyebrow : "Featured Collection";
  const heading = content?.featuredHeading !== undefined ? content.featuredHeading : "The New\nCollection";
  const body = content?.featuredBody !== undefined ? content.featuredBody : "Carefully developed pieces crafted in luxury cloth — slower construction, nothing decorative. Built to sit alongside every garment you already own.";

  return (
    <section className="container-x py-28 lg:py-44" aria-label="The new collection">
      <div className="grid items-center gap-16 lg:gap-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-7" direction="left">
          <Link href="/collections/new-season" className="group relative block overflow-hidden bg-transparent border border-ink/5 shadow-2xl">
            <div className="relative aspect-[4/5] sm:aspect-[16/11]">
              <Image src={banner} alt={`Featured Collection — ${BRAND_CONFIG.brandName}`} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-ink/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            </div>
          </Link>
        </Reveal>
        <div className="lg:col-span-5 lg:-ml-12 lg:pb-16">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow !text-gold-dark font-mono font-medium tracking-[0.25em]">{eyebrow}</p>
            </Reveal>
          )}
          {heading && (
            <Reveal delay={120}>
              <h2 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-[5rem] font-light text-ink whitespace-pre-line text-balance">
                {heading}
              </h2>
            </Reveal>
          )}
          {body && (
            <Reveal delay={220}>
              <p className="mt-8 max-w-sm text-[15px] leading-[1.8] text-ink/70 font-light whitespace-pre-line">{body}</p>
            </Reveal>
          )}
          <Reveal delay={320}>
            <Button href="/collections/new-season" variant="ghost" className="mt-8">
              Explore Collection <ArrowRight className="size-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 3 — SELECTED PIECES ————————————————— */
export function SelectedPieces({ products }: { products: Product[] }) {
  return (
    <section className="bg-cream/30 border-y border-line/40 py-28 lg:py-36" aria-label="Selected pieces">
      <div className="container-x">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6 border-b border-line/50 pb-8">
          <Reveal>
            <div>
              <p className="eyebrow !text-gold-dark font-mono font-medium tracking-[0.25em]">Curated Archive</p>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl font-light text-ink">Selected Silhouettes</h2>
            </div>
          </Reveal>
          <Reveal delay={150} className="sm:pr-24">
            <Button href="/shop" variant="ghost" className="text-[10px]">
              View All Garments <ArrowRight className="size-3.5 ml-1" strokeWidth={1.5} />
            </Button>
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
    { title: "Men", href: "/shop?gender=men", image: menBanner, alt: "Menswear collection" },
    { title: "Women", href: "/shop?gender=women", image: womenBanner, alt: "Womenswear collection" },
  ];
  return (
    <section aria-label="Shop by category" className="grid md:grid-cols-2">
      {cats.map((c) => (
        <Link key={c.title} href={c.href} className="group relative block overflow-hidden">
          <div className="relative aspect-[4/5] md:aspect-[3/4]">
            <Image src={c.image} alt={c.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-[2.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent transition-opacity duration-700 group-hover:opacity-90" aria-hidden />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-10 sm:p-16 text-paper">
            <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light transform transition-transform duration-700 group-hover:-translate-y-2">{c.title}</h3>
            <div className="mt-4 overflow-hidden">
              <p className="inline-flex items-center gap-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-gold transform transition-transform duration-700 translate-y-full group-hover:translate-y-0 group-hover:text-gold-light">
                Explore {c.title} <ArrowRight className="size-3.5" strokeWidth={1.5} />
              </p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}

/* ————————————————— SECTION 5 — BRAND STORY ————————————————— */
export function Story({ banner = DEFAULT_BANNERS.story, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.storyEyebrow !== undefined ? content.storyEyebrow : "The Philosophy";
  const heading = content?.storyHeading !== undefined ? content.storyHeading : "Designed for movement.\nBuilt with intention.";
  const body = content?.storyBody !== undefined ? content.storyBody : `${BRAND_CONFIG.brandName} began with a simple fatigue: closets full of clothes, nothing worth wearing. We make the opposite — a narrow line of garments in heavyweight natural cloth, cut generously and finished slowly.`;

  return (
    <section className="bg-ink text-paper" aria-label="The brand philosophy">
      <div className="container-x grid gap-16 py-28 lg:grid-cols-2 lg:gap-24 lg:py-40">
        <div className="flex flex-col justify-center">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow !text-gold font-mono font-medium tracking-[0.25em]">{eyebrow}</p>
            </Reveal>
          )}
          {heading && (
            <Reveal delay={120}>
              <h2 className="mt-6 font-display text-5xl leading-[1.08] sm:text-6xl font-light whitespace-pre-line text-balance">
                {heading}
              </h2>
            </Reveal>
          )}
          {body && (
            <Reveal delay={240}>
              <div className="mt-10 max-w-md space-y-6 text-[15px] leading-[1.8] text-paper/70 font-light whitespace-pre-line">
                <p>{body}</p>
              </div>
            </Reveal>
          )}
          <Reveal delay={340}>
            <div className="mt-12">
              <Button href="/about" variant="inverse" size="lg">
                Our Story
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal className="relative min-h-[450px] lg:min-h-0" direction="left">
          <div className="relative h-full min-h-[450px] overflow-hidden border border-paper/10 shadow-2xl rounded-sm">
            <Image src={banner} alt="Macro detail of textile fabric" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-[2.5s] hover:scale-105" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 6 — COLLECTION FEATURE ————————————————— */
export function CollectionFeature({ banner = DEFAULT_BANNERS.hero, content }: { banner?: string; content?: any }) {
  const eyebrow = content?.coreEyebrow !== undefined ? content.coreEyebrow : "Permanent Line";
  const heading = content?.coreHeading !== undefined ? content.coreHeading : "Core 01";
  const body = content?.coreBody !== undefined ? content.coreBody : "The permanent wardrobe. Seasonless silhouettes in natural tones — restocked continuously, never discounted into noise.";

  return (
    <section className="container-x py-28 lg:py-44" aria-label="Core collection">
      <div className="grid items-center gap-14 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-4">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow !text-gold-dark font-mono font-medium tracking-[0.25em]">{eyebrow}</p>
            </Reveal>
          )}
          {heading && (
            <Reveal delay={120}>
              <h2 className="mt-5 font-display text-6xl tracking-tight sm:text-7xl font-light text-ink whitespace-pre-line">
                {heading}
              </h2>
            </Reveal>
          )}
          {body && (
            <Reveal delay={220}>
              <p className="mt-8 max-w-sm text-[15px] leading-[1.8] text-ink/70 font-light whitespace-pre-line">{body}</p>
            </Reveal>
          )}
          <Reveal delay={320}>
            <div className="mt-10">
              <Button href="/collections/core" variant="outline" size="md">
                View Core Collection
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal className="order-1 lg:order-2 lg:col-span-8" direction="left">
          <Link href="/collections/core" className="group relative block overflow-hidden bg-transparent shadow-xl rounded-sm">
            <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[16/10]">
              <Image src={banner} alt="Core garments in studio" fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-ink/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
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
    <section className="bg-cream/20 border-t border-line/50 py-28 lg:py-40" aria-label="Featured product">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <Reveal className="relative" direction="left">
          <Link href={`/products/${product.slug}`} className="group relative block overflow-hidden border border-line/40 shadow-2xl bg-paper rounded-sm">
            <div className="relative aspect-[4/5]">
              <Image src={product.images?.[0]?.src || "/images/product-hoodie.jpg"} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
            </div>
          </Link>
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow !text-gold-dark font-mono font-medium tracking-[0.25em]">Piece of the Season</p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-5 font-display text-5xl sm:text-6xl font-light text-ink text-balance">{product.name}</h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-5 flex items-center gap-4">
              <Price amountBDT={product.priceBDT} className="text-2xl font-medium text-ink" />
              <span className="flex items-center gap-1.5 text-[11px] text-ink/60 font-mono tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                <Star className="size-3.5 fill-gold text-gold" strokeWidth={1} /> {product.rating} ({product.reviews} REVIEWS)
              </span>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <p className="mt-8 max-w-md text-[15px] leading-[1.8] text-ink/70 font-light">{product.description || product.shortDescription}</p>
          </Reveal>
          <Reveal delay={380}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href={`/products/${product.slug}`} variant="primary" size="lg">
                Shop Now
              </Button>
              <Button href="/shop" variant="outline" size="lg">
                View All Pieces
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ————————————————— SECTION 8 — NEWSLETTER ————————————————— */
export function NewsletterSection({ content }: { content?: any }) {
  const eyebrow = content?.newsletterEyebrow !== undefined ? content.newsletterEyebrow : "Atelier Dispatch";
  const heading = content?.newsletterHeading !== undefined ? content.newsletterHeading : "Stay in Form";
  const body = content?.newsletterBody !== undefined ? content.newsletterBody : "New pieces, private restocks and studio notes. Strictly one letter a month — never more, always worth opening.";

  return (
    <section className="container-x py-28 lg:py-44" aria-label="Newsletter">
      <Reveal className="mx-auto max-w-4xl border border-line/60 bg-paper/60 backdrop-blur-md p-10 sm:p-24 shadow-[0_20px_50px_-12px_rgba(14,13,11,0.05)] text-center rounded-sm">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 border border-gold/30 bg-gold/5 px-5 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-gold-dark mb-6 rounded-xs shadow-sm">
            <Sparkles className="size-3.5" />
            <span className="font-semibold">{eyebrow}</span>
          </div>
        )}
        {heading && <h2 className="mt-3 font-display text-5xl sm:text-6xl font-light text-ink tracking-tight">{heading}</h2>}
        {body && <p className="mt-6 text-[15px] leading-[1.8] text-ink/70 max-w-md mx-auto font-light whitespace-pre-line text-balance">{body}</p>}
        <div className="mt-12 w-full max-w-md mx-auto relative z-20">
          <NewsletterForm />
        </div>
      </Reveal>
    </section>
  );
}
// END OF FILE src/components/home/sections.tsx
