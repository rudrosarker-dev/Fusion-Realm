// START OF FILE src/app/search/page.tsx
import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-card";
import { Button, EmptyState } from "@/components/ui/primitives";
import { db } from "@/db";
import { products } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { desc, ilike, or } from "drizzle-orm";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Search — ${BRAND_CONFIG.brandName}`,
  description: `Search ${BRAND_CONFIG.brandName} products, categories and collections.`,
  robots: { index: false },
};

async function getSearchResults(query: string): Promise<Product[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const qStr = `%${query.trim()}%`;
    const rows = await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, qStr),
          ilike(products.category, qStr),
          ilike(products.description, qStr),
          ilike(products.collection, qStr)
        )
      )
      .orderBy(desc(products.createdAt));

    if (!rows || rows.length === 0) return [];

    return rows.map((p: any) => ({
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
  } catch (err) {
    console.error("Search DB error:", err);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const results = await getSearchResults(q);

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <p className="eyebrow">Search</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">
        {q ? <>Results for <em className="font-light">“{q}”</em></> : "Search the collection"}
      </h1>

      {!q || q.trim().length < 2 ? (
        <EmptyState
          title="Type at least two characters to search."
          copy="Try a category like “hoodie” or “trouser”, or a collection like “studio”."
          actionLabel="Browse All Products"
          actionHref="/shop"
        />
      ) : results.length ? (
        <>
          <p className="mt-4 text-sm text-fog font-mono">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          <div className="mt-10">
            <ProductGrid products={results} priorityCount={4} />
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-3xl">No results for “{q}”</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ash">
            We keep the range intentionally narrow. Try a broader word — or explore the full collection instead.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/shop">Shop All</Button>
            <Button href="/collections/new-season" variant="outline">
              New Season
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
// END OF FILE src/app/search/page.tsx
