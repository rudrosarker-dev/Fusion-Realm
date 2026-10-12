import { COLLECTIONS } from "./data/collections";
import { PRODUCTS } from "./data/products";
import type { Product } from "./types";

export interface SearchResults {
  products: Product[];
  collections: { slug: string; title: string }[];
  suggestions: string[];
}

/** Lightweight local search — architecture ready to swap for a
    server/DB-backed endpoint later. */
export function search(query: string, limit = 8): SearchResults {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { products: [], collections: [], suggestions: [] };

  const words = q.split(/\s+/);
  const score = (p: Product) => {
    let s = 0;
    const name = p.name.toLowerCase();
    const cat = p.category.toLowerCase();
    const col = p.collection.toLowerCase();
    for (const w of words) {
      if (name.includes(w)) s += 4;
      if (name.startsWith(w)) s += 2;
      if (cat.includes(w)) s += 2;
      if (col.includes(w)) s += 1.5;
      if (p.shortDescription.toLowerCase().includes(w)) s += 1;
      if (p.colors.some((c) => c.name.toLowerCase().includes(w))) s += 1;
      if (p.gender.startsWith(w)) s += 1;
    }
    if (p.bestSeller) s += 0.4;
    return s;
  };

  const products = PRODUCTS.map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 2)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p)
    .slice(0, limit);

  const collections = COLLECTIONS.filter(
    (c) => c.title.toLowerCase().includes(q) || q.includes(c.slug.replace("-", " ")),
  ).map((c) => ({ slug: c.slug, title: c.title }));

  const pool = new Set<string>();
  PRODUCTS.forEach((p) => {
    if (p.category.toLowerCase().includes(q)) pool.add(p.category);
    if (p.name.toLowerCase().includes(q)) pool.add(p.name);
  });
  COLLECTIONS.forEach((c) => {
    if (c.title.toLowerCase().includes(q)) pool.add(c.title);
  });

  return { products, collections, suggestions: [...pool].slice(0, 5) };
}

/** Full results for the /search results page (no limit). */
export function searchAll(query: string): Product[] {
  return search(query, 100).products;
}
