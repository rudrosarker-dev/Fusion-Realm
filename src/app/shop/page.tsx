// START OF FILE src/app/shop/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ShopClient, type ShopQuery } from "@/components/shop/shop-client";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Shop All",
  description: `Browse the ${BRAND_CONFIG.brandName} collection — heavyweight jersey, tailored wool, knitwear, denim and outerwear.`,
};

async function fetchShopData(): Promise<{ productsList: Product[]; shopContent: any }> {
  let productsList: any[] = [];
  let shopContent = {
    eyebrow: `${BRAND_CONFIG.brandName} — SS26`,
    heading: "All Products",
    description: "Quiet garments in heavyweight natural cloth. Filter by size, colour and collection to find your uniform.",
  };

  try {
    const [live, contentRes]: any = await Promise.all([
      db.select().from(products).orderBy(desc(products.createdAt)),
      db.execute(sql`SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;`),
    ]);

    if (live && Array.isArray(live) && live.length > 0) {
      productsList = live.map((p: any) => ({
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

    if (contentRes?.rows?.[0]?.content?.shopContent) {
      shopContent = {
        ...shopContent,
        ...contentRes.rows[0].content.shopContent,
      };
    }
  } catch (error) {
    console.error("Shop page DB error:", error);
  }

  return { productsList, shopContent };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };

  const initial: ShopQuery = {
    gender: get("gender"),
    category: get("category"),
    collection: get("collection"),
    filter: get("filter"),
  };

  const { productsList, shopContent } = await fetchShopData();

  return (
    <Suspense fallback={<div className="container-x pt-36 pb-24 text-fog text-xs font-mono">Loading atelier collection...</div>}>
      <ShopClient initial={initial} serverProducts={productsList} shopContent={shopContent} />
    </Suspense>
  );
}
// END OF FILE src/app/shop/page.tsx
