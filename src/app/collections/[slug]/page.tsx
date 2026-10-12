import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductGrid } from "@/components/product/product-card";
import { Reveal } from "@/components/ui/overlays";
import { COLLECTIONS, getCollection } from "@/lib/data/collections";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

// ডাটাবেজ থেকে নির্দিষ্ট কালেকশনের লাইভ প্রোডাক্ট ফেচ করা
async function fetchCollectionProducts(slug: string): Promise<Product[]> {
  try {
    const live = await db.select().from(products).orderBy(desc(products.createdAt));
    if (live && live.length > 0) {
      const formatted: Product[] = live.map((p) => ({
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

      if (slug === "new-season") {
        const season = formatted.filter((p) => p.newArrival);
        return season.length ? season : formatted;
      }
      return formatted.filter((p) => p.collection === slug);
    }
  } catch (err) {
    console.error("Collection DB query error:", err);
  }
  return [];
}

// ব্যানার CMS থেকে লাইভ কালেকশন ব্যানার আনা
async function getLiveBanner(): Promise<string> {
  try {
    const res: any = await db.execute(sql`
      SELECT banners FROM store_banners WHERE id = 'main_banners' LIMIT 1;
    `);
    if (res.rows && res.rows.length > 0 && res.rows[0].banners?.collection) {
      return res.rows[0].banners.collection;
    }
  } catch {}
  return "/images/collection.jpg";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.title,
    description: collection.description,
    openGraph: {
      title: `${collection.title} — ${BRAND_CONFIG.brandName}`,
      description: collection.description,
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const [productsList, dynamicBanner] = await Promise.all([
    fetchCollectionProducts(slug),
    getLiveBanner(),
  ]);

  return (
    <>
      <section className="relative flex min-h-[70svh] items-end overflow-hidden" aria-label={collection.title}>
        <Image
          src={dynamicBanner || collection.image}
          alt={`${collection.title} — ${BRAND_CONFIG.brandName}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-black/30" aria-hidden />
        <div className="container-x relative z-10 pb-14 pt-40 text-paper">
          <Reveal>
            <p className="eyebrow !text-paper/70">{collection.eyebrow}</p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-3 font-display text-5xl tracking-tight sm:text-6xl lg:text-7xl">{collection.title}</h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-paper/85 sm:text-base">{collection.description}</p>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-16 lg:py-24" aria-label={`${collection.title} products`}>
        <div className="mb-10 flex items-end justify-between">
          <p className="text-sm text-fog font-mono">
            {productsList.length} {productsList.length === 1 ? "piece" : "pieces in collection"}
          </p>
          <a href="/shop" className="link-line text-[11px] font-medium uppercase tracking-[0.2em]">
            Shop Everything
          </a>
        </div>

        {productsList.length > 0 ? (
          <ProductGrid products={productsList} priorityCount={4} />
        ) : (
          <div className="py-20 text-center border border-line bg-cream/20">
            <p className="font-display text-2xl text-ink">New pieces arriving soon.</p>
            <p className="text-xs text-ash mt-2 max-w-sm mx-auto">
              Garments for this collection are currently being crafted in our Dhaka studio.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
