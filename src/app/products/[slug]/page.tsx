// START OF FILE src/app/products/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductGallery } from "@/components/product/gallery";
import { ProductGrid } from "@/components/product/product-card";
import { ProductInfo } from "@/components/product/product-info";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Accordion, Breadcrumb } from "@/components/ui/primitives";
import { getCollection } from "@/lib/data/collections";
import { getProductBySlug } from "@/lib/data/products";
import type { Product } from "@/lib/types";

export const revalidate = 60;

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const live = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

    if (live && live.length > 0) {
      const p = live[0];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        gender: p.gender as any,
        collection: (p.collection as any) || "core",
        priceBDT: p.priceBDT,
        compareAtBDT: p.compareAtBDT ?? undefined,
        shortDescription: p.shortDescription || `${p.name} crafted in luxury cloth.`,
        description: p.description || `${p.name} by Tholvex Studio.`,
        material: p.material || "100% Combed Cotton.",
        fit: p.fit || "Relaxed fit.",
        care: (p.care as any) || ["Machine wash cold", "Line dry"],
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
      } as Product;
    }
  } catch (err) {
    console.error("Live DB product query error:", err);
  }

  return getProductBySlug(slug) || null;
}

async function fetchRelatedProducts(currentProduct: Product): Promise<Product[]> {
  try {
    const live = await db.select().from(products).where(ne(products.id, currentProduct.id)).orderBy(desc(products.createdAt)).limit(8);

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
        description: p.description || `${p.name} by Tholvex Studio.`,
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

      const sameCategory = formatted.filter((p) => p.category === currentProduct.category || p.gender === currentProduct.gender);
      const others = formatted.filter((p) => p.category !== currentProduct.category && p.gender !== currentProduct.gender);

      return [...sameCategory, ...others].slice(0, 4);
    }
  } catch (err) {
    console.error("Related products DB query error:", err);
  }

  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} — Tholvex Studio`,
      description: product.shortDescription,
      images: [{ url: product.images?.[0]?.src || "/images/product-tee.jpg", width: 1200, height: 1600 }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) notFound();

  const collection = getCollection(product.collection);
  const related = await fetchRelatedProducts(product);

  return (
    <>
      <div className="container-x pt-28 lg:pt-32">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            collection ? { label: collection.title, href: `/collections/${collection.slug}` } : { label: product.category },
            { label: product.name },
          ]}
        />
        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} name={product.name} />
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <ProductInfo product={product} />
              <div className="mt-8">
                <Accordion
                  items={[
                    { title: "Product Details", content: <p>{product.description}</p> },
                    { title: "Materials", content: <p>{product.material}</p> },
                    { title: "Fit & Silhouette", content: <p>{product.fit}</p> },
                    {
                      title: "Care Instructions",
                      content: (
                        <ul className="list-disc space-y-1.5 pl-4">
                          {(product.care || []).map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      ),
                    },
                    {
                      title: "Shipping & Returns",
                      content: (
                        <p>
                          Standard delivery ৳100 inside Dhaka (24–48 hours); nationwide ৳150 (2–4 days). Free
                          delivery over ৳15,000. Unworn pieces with tags can be returned within 14 days.
                        </p>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x py-24" aria-label="You may also like">
          <p className="eyebrow !text-[#a68352] mb-2 font-mono">Complete the Look</p>
          <h2 className="mb-8 font-display text-3xl">You May Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}

      <RecentlyViewed currentSlug={product.slug} />
    </>
  );
}
// END OF FILE src/app/products/[slug]/page.tsx
