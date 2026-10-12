// START OF FILE src/app/page.tsx
import {
  CategorySplit,
  CollectionFeature,
  FeaturedCollection,
  Hero,
  NewsletterSection,
  ProductHighlight,
  SelectedPieces,
  Story,
  ValueMarquee,
} from "@/components/home/sections";
import { ShopClient } from "@/components/shop/shop-client";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { Metadata } from "next";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export const metadata: Metadata = {
  title: `${BRAND_CONFIG.brandName} — Considered Garments for Everyday Movement`,
  description:
    "Heavyweight jersey, tailored wool and considered outerwear. An independent fashion house designing quiet, precise garments in Dhaka.",
  openGraph: {
    title: `${BRAND_CONFIG.brandName} — Considered Garments`,
    description: "An independent fashion house designing quiet, precise garments in Dhaka.",
    url: "https://tholvexstudio.vercel.app",
    siteName: BRAND_CONFIG.brandName,
    images: [
      {
        url: "/images/hero.jpg",
        width: 1200,
        height: 630,
        alt: `${BRAND_CONFIG.brandName} New Season`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

async function getSiteConfig() {
  const defaults = {
    banners: {
      hero: "/images/hero.jpg",
      collection: "/images/collection.jpg",
      men: "/images/category-men.jpg",
      women: "/images/category-women.jpg",
      story: "/images/story.jpg",
    },
    homepageMode: "editorial",
    marqueeItems: "Dhaka Atelier Hand-Finished | Numbered Micro Runs | Heavyweight Japanese Twill | Garment Washed Character | Complimentary Delivery Over ৳15,000",
    homeContent: {
      heroEyebrow: "Winter Edit — 2026",
      heroHeading: "Quiet warmth.\nLasting form.",
      heroBody: "Considered layers, tactile knits and outerwear for the colder days. Made to move with you, season after season.",
      featuredEyebrow: "The Winter Edit",
      featuredHeading: "The New\nCollection",
      featuredBody: "A considered winter wardrobe in rich texture, quiet colour and enduring silhouettes.",
      storyEyebrow: "The Atelier Philosophy",
      storyHeading: "Designed for movement.\nBuilt with intention.",
      storyBody: "Thoughtful materials, precise construction and garments made to be worn often.",
      coreEyebrow: "Permanent Line",
      coreHeading: "Core 01",
      coreBody: "The permanent uniform. Seasonless garments in heavyweight earth tones — continually restocked, refined, and never discounted.",
      newsletterEyebrow: "Atelier Dispatch",
      newsletterHeading: "Notes from the studio",
      newsletterBody: "New pieces, studio notes and considered updates, delivered occasionally.",
    },
  };

  try {
    const [bannerRes, contentRes]: any = await Promise.all([
      db.execute(sql`SELECT banners FROM store_banners WHERE id = 'main_banners' LIMIT 1;`).catch(() => ({ rows: [] })),
      db.execute(sql`SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;`).catch(() => ({ rows: [] })),
    ]);

    const banners = {
      ...defaults.banners,
      ...(bannerRes?.rows?.[0]?.banners || {}),
    };

    const siteContent = contentRes?.rows?.[0]?.content || {};
    const homepageMode = siteContent.homepageMode || "editorial";
    const marqueeItems = siteContent.marqueeItems || defaults.marqueeItems;
    const homeContent = {
      ...defaults.homeContent,
      ...(siteContent.homeContent || {}),
    };

    return { banners, homepageMode, marqueeItems, homeContent };
  } catch (error) {
    console.error("Site config fallback error:", error);
    return defaults;
  }
}

async function getHomeProducts(): Promise<Product[]> {
  try {
    const live: any = await db.select().from(products).orderBy(desc(products.createdAt));
    if (live && Array.isArray(live) && live.length > 0) {
      return live.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        gender: p.gender as any,
        collection: (p.collection as any) || "core",
        priceBDT: p.priceBDT,
        compareAtBDT: p.compareAtBDT ?? undefined,
        shortDescription: p.shortDescription || `${p.name} crafted in luxury cloth.`,
        description: p.description || `${p.name} by ${BRAND_CONFIG.brandName}.`,
        material: p.material || "100% Combed Cotton.",
        fit: p.fit || "Relaxed fit.",
        care: (p.care as any) || ["Machine wash cold"],
        images: (p.images as any) || [{ src: "/images/product-tee.jpg", alt: p.name }],
        colors: (p.colors as any) || [{ name: "Black", hex: "#171614" }],
        sizes: (p.sizes as any) || [{ size: "M", stock: 10 }],
        sku: p.sku || p.slug,
        featured: Boolean(p.featured),
        bestSeller: Boolean(p.bestSeller),
        newArrival: Boolean(p.newArrival),
        rating: Number(p.rating || 5.0),
        reviews: p.reviewsCount || 0,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        sizeSystem: "apparel",
      }));
    }
  } catch (err) {
    console.error("Home DB query error:", err);
  }
  return [];
}

export default async function HomePage() {
  const [{ banners, homepageMode, marqueeItems, homeContent }, allProducts] = await Promise.all([
    getSiteConfig(),
    getHomeProducts(),
  ]);

  if (homepageMode === "direct-shop") {
    return (
      <div className="pt-16 bg-cream">
        <ShopClient initial={{}} serverProducts={allProducts} />
      </div>
    );
  }

  const featured = allProducts.filter((p) => p.featured);
  const selected = (featured.length > 0 ? featured : allProducts).slice(0, 8);
  const highlightedProduct = featured[0] || allProducts[0] || null;

  return (
    <main className="bg-paper text-ink min-h-screen">
      <Hero banner={banners.hero} content={homeContent} />
      <ValueMarquee itemsString={marqueeItems} />
      <FeaturedCollection banner={banners.collection} content={homeContent} />
      {selected.length > 0 && <SelectedPieces products={selected} />}
      <CategorySplit menBanner={banners.men} womenBanner={banners.women} />
      <Story banner={banners.story} content={homeContent} />
      <CollectionFeature banner={banners.hero} content={homeContent} />
      {highlightedProduct && <ProductHighlight product={highlightedProduct} />}
      <NewsletterSection content={homeContent} />
    </main>
  );
}
// END OF FILE src/app/page.tsx
