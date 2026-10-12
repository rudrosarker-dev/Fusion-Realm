"use client";

import { useEffect } from "react";
import { getProductBySlug } from "@/lib/data/products";
import { useRecent } from "@/lib/store";
import { ProductGrid } from "./product-card";

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const { slugs, push } = useRecent();

  useEffect(() => {
    push(currentSlug);
  }, [currentSlug, push]);

  const products = slugs
    .filter((s) => s !== currentSlug)
    .map((s) => getProductBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  if (!products.length) return null;
  return (
    <section className="container-x pb-24" aria-label="Recently viewed">
      <p className="eyebrow mb-2">Keep Browsing</p>
      <h2 className="mb-8 font-display text-3xl">Recently Viewed</h2>
      <ProductGrid products={products} />
    </section>
  );
}
