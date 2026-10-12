import type { Collection, Product } from "../types";
import { IMG, PRODUCTS } from "./products";

export const COLLECTIONS: Collection[] = [
  {
    slug: "new-season",
    title: "New Season",
    eyebrow: "SS26 — Chapter One",
    description:
      "The opening chapter of the year: heavyweight jersey, washed twill and outerwear built for transition. Every piece is designed to work with what you already own.",
    image: IMG.collection,
  },
  {
    slug: "core",
    title: "Core Collection",
    eyebrow: "Permanent Line",
    description:
      "Our permanent wardrobe. The silhouettes we return to season after season — no seasons, no discounts theatre, only garments refined until they disappear into daily life.",
    image: IMG.hero,
  },
  {
    slug: "essentials",
    title: "Essentials",
    eyebrow: "Daily Uniform",
    description:
      "The quiet foundation: tees, fleece and accessories made to the same standard as everything else we make. Priced honestly, worn constantly.",
    image: IMG.story,
  },
  {
    slug: "studio",
    title: "Studio Collection",
    eyebrow: "Made With Intent",
    description:
      "Our most considered work. Heavier cloths, slower construction, smaller runs — developed in the atelier and produced without compromise.",
    image: IMG.collection,
  },
  {
    slug: "limited",
    title: "Limited Edition",
    eyebrow: "Numbered Runs",
    description:
      "Small, numbered productions explored outside the permanent line. When a run ends, it ends; each piece carries its number inside.",
    image: IMG.story,
  },
];

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function getCollectionProducts(slug: string): Product[] {
  if (slug === "new-season") {
    const season = PRODUCTS.filter((p) => p.newArrival);
    return season.length ? season : PRODUCTS.slice(0, 8);
  }
  return PRODUCTS.filter((p) => p.collection === slug);
}

export { IMG };
